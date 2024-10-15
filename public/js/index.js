/* eslint-disable */
import 'core-js/actual';
import { login } from './login';
import { logout } from './login';
import { updateSettings } from './updateSettings';

console.log('Hello from parcel');
// DOM
const loginForm = document.querySelector('.form-login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserDataForm = document.querySelector('.form-user-data');
const updateUserPasswordForm = document.querySelector('.form-user-settings');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateUserDataForm) {
  updateUserDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;

    // Moramo ovako raditi zbog images
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    // console.log('FORM');
    // for (let [key, value] of form.entries()) {
    //   console.log(key, value);
    // }

    updateSettings(form, 'data');
    // updateSettings({ name, email }, 'data');
  });
}

if (updateUserPasswordForm) {
  updateUserPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = document.querySelector('.btn--save-password');
    btn.innerHTML = 'Updating...';

    const passwordCurrent = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;

    updateSettings(
      { passwordCurrent, newPassword, passwordConfirm },
      'password',
    ).then(() => {
      document.querySelector('#password').value = '';
      document.querySelector('#password-confirm').value = '';
      document.querySelector('#password-current').value = '';

      btn.innerHTML = 'Save password';
    });
  });
}
