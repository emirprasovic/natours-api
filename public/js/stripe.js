import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51QAavcAQvZCakeQq3AIdR7wMyzPY1xCTT1UFwZ0iqWetBeMGg7PwIANjEldgKGaIL8gxGROKSSXsvFRW20LxPSy400Rtz1WDIw',
);

const fetchData = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await fetchData(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.session.id,
    });
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};
