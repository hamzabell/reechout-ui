import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import Icon from './Icon';

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  to: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  highlighted = false,
  buttonText,
  buttonVariant,
  to
}) => {
  return (
    <div className={`relative bg-white rounded-3xl p-10 ${
      highlighted
        ? 'border-2 border-blue-500 shadow-2xl scale-105 ring-4 ring-blue-500/10'
        : 'border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1'
    }`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
        <div className="text-6xl font-bold text-slate-900 mb-3">
          {price}
        </div>
        <p className="text-slate-600 text-lg">{description}</p>
      </div>

      <div className="space-y-4 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <Icon name="check" className="text-emerald-500 mt-0.5 flex-shrink-0" size="sm" />
            <span className="text-slate-700">{feature}</span>
          </div>
        ))}
      </div>

      <Link to={to}>
        <Button
          variant={buttonVariant}
          size="large"
          className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
            highlighted
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              : buttonVariant === 'primary'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
          }`}
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  );
};

const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlyPrice = 18;
  const annualPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  const monthlyAnnualPrice = Math.round(annualPrice / 12);

  return (
    <section id="pricing" className="py-28 px-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
            <Icon name="tag" className="mr-2" size="sm" />
            Pricing Plans
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
            Simple, transparent
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              pricing
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Start for free, upgrade when you're ready to scale
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-6">
            <span className={`text-lg font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Annual
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Free Plan */}
          <PricingCard
            title="Free"
            price="$0"
            description="Perfect for getting started"
            features={[
              "Up to 50 emails per month",
              "Basic AI personalization",
              "Simple analytics",
              "Email tracking",
              "Community support"
            ]}
            buttonText="Get Started"
            buttonVariant="secondary"
            to="/login"
          />

          {/* Pro Plan */}
          <PricingCard
            title="Pro"
            price={isAnnual ? `$${monthlyAnnualPrice}` : `$${monthlyPrice}`}
            description={isAnnual ? "per month (billed annually)" : "per month"}
            features={[
              "Unlimited emails",
              "Advanced AI personalization",
              "Detailed analytics & reporting",
              "Email tracking & deliverability monitoring",
              "Priority support",
              "Custom templates",
              "API access",
              "Team collaboration"
            ]}
            highlighted={true}
            buttonText="Start Free Trial"
            buttonVariant="primary"
            to="/login"
          />

          {/* Enterprise Plan */}
          <PricingCard
            title="Enterprise"
            price="Custom"
            description="For large teams"
            features={[
              "Everything in Pro",
              "Custom AI training",
              "Dedicated account manager",
              "SLA guarantee",
              "Custom integrations",
              "Advanced security features",
              "White-label options",
              "Priority feature requests"
            ]}
            buttonText="Contact Sales"
            buttonVariant="secondary"
            to="/login"
          />
        </div>

        {/* Trust indicators */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-slate-600">
            <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-slate-200">
              <Icon name="refresh" className="text-blue-600" size="sm" />
              <span className="font-medium">30-day free trial on Pro</span>
            </div>
            <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-slate-200">
              <Icon name="x" className="text-blue-600" size="sm" />
              <span className="font-medium">Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-slate-200">
              <Icon name="shield" className="text-blue-600" size="sm" />
              <span className="font-medium">30-day money back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;