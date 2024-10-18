/* eslint-disable */
import { showAlert } from './alerts';

const postData = async (url, data) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json();
};

export const login = async (email, password) => {
  const res = await postData('http://127.0.0.1:3000/api/v1/users/login', {
    email,
    password,
  });

  if (res.status === 'success') {
    showAlert('success', 'Successfully logged in');
    window.setTimeout(() => location.assign('/'), 1000);
  } else {
    showAlert('error', res.message);
  }
};

export const logout = async () => {
  // console.log('LOGOUT');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/v1/users/logout');
    const data = await res.json();
    // console.log(data);
    if (data.status === 'success') {
      // console.log('Success');
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out :o');
  }
};
