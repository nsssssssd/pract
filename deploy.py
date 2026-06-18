import paramiko
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

HOST = '186.246.8.52'
PORT = 2222
USER = 'root'
PASSWORD = 't?evF.UBeiX*z7'
REMOTE_DIR = '/root/pract'
BRANCH = 'mod-3'
PM2_PROCESS = 'tulpanomsk55'

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

    log_lines = []

    def log(msg):
        print(msg)
        log_lines.append(msg)

    def run(cmd, desc):
        log(f'\n=== {desc} ===')
        log(f'$ {cmd.strip()}')
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        rc = stdout.channel.recv_exit_status()
        if out:
            log(out[:5000])
        if err:
            log(f'ERR:\n{err[:2000]}')
        if rc != 0:
            raise RuntimeError(f'Command failed with exit code {rc}: {cmd.strip()}\n{err[:2000]}')
        return out

    try:
        # 1. Backup current runtime data and uploads
        run(f"""
cd {REMOTE_DIR}
mkdir -p /tmp/pract-deploy-backup
rm -rf /tmp/pract-deploy-backup/*
cp data.json /tmp/pract-deploy-backup/data.json.runtime 2>/dev/null || true
cp -r public/uploads /tmp/pract-deploy-backup/uploads 2>/dev/null || true
cp .env /tmp/pract-deploy-backup/.env 2>/dev/null || true
ls -la /tmp/pract-deploy-backup/
""", 'Backup runtime data.json, uploads and .env')

        # 2. Reset to the latest branch on origin
        run(f"""
cd {REMOTE_DIR}
git reset --hard
git fetch origin {BRANCH}
git reset --hard origin/{BRANCH}
git status
""", f'Pull latest origin/{BRANCH}')

        # 3. Merge runtime data.json with repository defaults
        sftp = client.open_sftp()
        backup_path = '/tmp/pract-deploy-backup/data.json.runtime'
        try:
            # Read runtime backup
            with sftp.file(backup_path, 'r') as f:
                runtime_raw = f.read().decode('utf-8', errors='replace')

            # Resolve possible leftover git stash conflict markers by keeping the
            # "Stashed changes" section (the live runtime version).
            runtime_raw = re.sub(
                r'<<<<<<< Updated upstream\n.*?=======\n(.*?)>>>>>>> Stashed changes',
                r'\1',
                runtime_raw,
                flags=re.DOTALL
            )
            runtime = json.loads(runtime_raw)

            # Read repository data.json (just reset to origin branch)
            with sftp.file(f'{REMOTE_DIR}/data.json', 'r') as f:
                repo = json.loads(f.read().decode('utf-8', errors='replace'))

            # Merge products:
            # - keep runtime products as-is (preserves live edits)
            # - add products from repo that don't exist in runtime (new demo items)
            # - assign default category='flower' to old runtime products without category
            runtime_products = {p['id']: p for p in runtime.get('products', [])}
            repo_products = {p['id']: p for p in repo.get('products', [])}

            for p in runtime_products.values():
                if not p.get('category'):
                    p['category'] = 'flower'

            for pid, p in repo_products.items():
                if pid not in runtime_products:
                    runtime_products[pid] = p

            runtime['products'] = list(runtime_products.values())

            # Ensure top-level sections exist
            for key in ['orders', 'users', 'verificationCodes']:
                if key not in runtime:
                    runtime[key] = []

            with sftp.file(f'{REMOTE_DIR}/data.json', 'w') as f:
                f.write(json.dumps(runtime, ensure_ascii=False, indent=2).encode('utf-8'))

            log(f'Merged data.json: {len(runtime["products"])} products, {len(runtime["orders"])} orders, {len(runtime["users"])} users')
        except Exception as e:
            log(f'WARNING: could not merge runtime data.json: {e}')
            log('Using repository data.json')
        finally:
            sftp.close()

        # 4. Restore uploads
        run(f"""
cd {REMOTE_DIR}
mkdir -p public/uploads
if [ -d /tmp/pract-deploy-backup/uploads ]; then
    cp -rn /tmp/pract-deploy-backup/uploads/* public/uploads/ 2>/dev/null || true
fi
ls -la public/uploads/ | head -20
""", 'Restore public/uploads')

        # 5. Install dependencies and build
        run(f"""
cd {REMOTE_DIR}
npm ci
rm -rf .next
npm run build
""", 'Install dependencies and build')

        # 6. Restart the app
        run(f"""
cd {REMOTE_DIR}
pm2 restart {PM2_PROCESS} || pm2 start npm --name {PM2_PROCESS} -- run start
pm2 save
""", 'Restart PM2 process')

        # 7. Health check
        run("""
sleep 5
curl -sf http://localhost:3000 > /dev/null && echo "Health check passed" || (echo "Health check failed" && exit 1)
""", 'Health check')

        log('\n=== Deploy finished successfully ===')

    except Exception as e:
        log(f'\n=== DEPLOY FAILED ===\n{e}')
    finally:
        client.close()

    with open('deploy_output.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(log_lines))
    print('Output written to deploy_output.txt')

if __name__ == '__main__':
    main()
