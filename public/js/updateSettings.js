/* eslint-disable */

import { showAlert } from './alerts';

const patchData = async (url, data) => {
  const response = await fetch(url, {
    method: 'PATCH',
    // headers: {
    //   'Content-Type': 'application/json',
    // },
    // body: JSON.stringify(data), // body data type must match "Content-Type" header
    body: data,
  });
  return response.json();
};

export const updateSettings = async (data, type = 'data') => {
  const url =
    type === 'password'
      ? 'http://127.0.0.1:3000/api/v1/users/update-my-password'
      : 'http://127.0.0.1:3000/api/v1/users/update-me';
  const res = await patchData(url, data);

  if (res.status === 'success') {
    showAlert('success', `Successfully updated ${type}`);
    // window.setTimeout(() => location.assign('/'), 1000);
  } else {
    showAlert('error', res.message);
  }
};
