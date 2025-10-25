"use client";

import { useState } from 'react';

export const Payment = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    // TODO: Implement the payment logic
    console.log(`Sending ${amount} to ${recipient}`);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-zeta-grey-800">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Send Payment</h2>
      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Recipient Address
        </label>
        <input
          type="text"
          name="recipient"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
          placeholder="0x..."
        />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount
        </label>
        <input
          type="text"
          name="amount"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zeta-grey-700 dark:border-zeta-grey-600 dark:text-white"
          placeholder="0.0"
        />
      </div>
      <button
        onClick={handleSend}
        className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-zeta-blue-700 dark:hover:bg-zeta-blue-800"
      >
        Send
      </button>
    </div>
  );
};
