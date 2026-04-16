import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import styles from './Auth.module.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 8) return 'Минимум 8 символов';
  if (!/[A-Za-zА-Яа-яЁё]/.test(password)) return 'Должна быть хотя бы одна буква';
  if (!/\d/.test(password)) return 'Должна быть хотя бы одна цифра';
  return '';
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailError = touched.email && !validateEmail(form.email) ? 'Введите корректный email' : '';
  const passwordError = touched.password ? validatePassword(form.password) : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateEmail(form.email)) { setError('Введите корректный email'); return; }
    const pwdErr = validatePassword(form.password);
    if (pwdErr) { setError(pwdErr); return; }

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🌷</div>
        <h1 className={styles.title}>Создать аккаунт</h1>
        <p className={styles.sub}>Регистрация займёт минуту</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Имя</label>
            <input
              className={styles.input}
              placeholder="Ваше имя"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              type="text"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              required
            />
            {emailError && <span className={styles.fieldError}>{emailError}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <input
              className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
              type="password"
              placeholder="Минимум 8 символов, буква и цифра"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              required
            />
            {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Создаём...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.hint}>
          Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
