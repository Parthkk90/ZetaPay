"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function MerchantOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: '',
    businessType: '',
    website: '',
    description: '',
    
    // Step 2: Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    
    // Step 3: KYC Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    taxId: '',
    idType: 'passport',
    idNumber: '',
    
    // Step 4: Payment Settings
    acceptedTokens: ['ZETA'],
    settlementCurrency: 'USD',
    webhookUrl: '',
    returnUrl: '',
  });

  const steps: OnboardingStep[] = [
    { id: 1, title: 'Business Information', description: 'Tell us about your business', completed: currentStep > 1 },
    { id: 2, title: 'Contact Details', description: 'How can we reach you?', completed: currentStep > 2 },
    { id: 3, title: 'KYC Verification', description: 'Verify your identity', completed: currentStep > 3 },
    { id: 4, title: 'Payment Settings', description: 'Configure payment options', completed: currentStep > 4 },
    { id: 5, title: 'Review & Submit', description: 'Review and complete setup', completed: false },
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/v1/merchants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Onboarding failed. Please try again.');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${currentStep === step.id 
                      ? 'border-indigo-600 bg-indigo-600 text-white' 
                      : step.completed 
                        ? 'border-green-600 bg-green-600 text-white' 
                        : 'border-gray-300 bg-white text-gray-500'}
                  `}>
                    {step.completed ? '✓' : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${step.completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${currentStep === step.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {steps[currentStep - 1].description}
          </p>

          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Acme Inc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="individual">Individual/Sole Proprietor</option>
                  <option value="company">Company</option>
                  <option value="nonprofit">Non-Profit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select country...</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  {/* Add more countries */}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: KYC Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We need to verify your identity to comply with financial regulations.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tax ID / EIN *
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="XX-XXXXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID Type *
                </label>
                <select
                  value={formData.idType}
                  onChange={(e) => handleInputChange('idType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📋 You'll be redirected to our KYC provider to upload ID documents after submitting this form.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Payment Settings */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accepted Tokens *
                </label>
                <div className="space-y-2">
                  {['ZETA', 'ETH', 'BTC', 'USDT', 'USDC', 'DAI'].map(token => (
                    <label key={token} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.acceptedTokens.includes(token)}
                        onChange={(e) => {
                          const newTokens = e.target.checked
                            ? [...formData.acceptedTokens, token]
                            : formData.acceptedTokens.filter(t => t !== token);
                          handleInputChange('acceptedTokens', newTokens);
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{token}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Settlement Currency *
                </label>
                <select
                  value={formData.settlementCurrency}
                  onChange={(e) => handleInputChange('settlementCurrency', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://your-site.com/webhooks/zetapay"
                />
                <p className="mt-1 text-sm text-gray-500">
                  We'll send payment notifications to this URL
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Return URL
                </label>
                <input
                  type="url"
                  value={formData.returnUrl}
                  onChange={(e) => handleInputChange('returnUrl', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://your-site.com/payment/success"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Customers will return to this URL after payment
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Business Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formData.businessName} • {formData.businessType}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formData.email} • {formData.phone}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Tokens: {formData.acceptedTokens.join(', ')} • Settlement: {formData.settlementCurrency}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📱 What happens next?</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>We'll review your application (usually within 24 hours)</li>
                  <li>You'll receive API keys via email</li>
                  <li>Complete KYC verification with our partner</li>
                  <li>Start accepting crypto payments!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              Back
            </button>
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
