import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Icon from '../components/Icon';
import PricingSection from '../components/PricingSection';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="px-6 py-4 mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/logo.svg" alt="ReechOut" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl font-bold text-slate-900">Reechout</h1>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
                >
                  Pricing
                </button>
                <Link to="/login" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
                  Sign in
                </Link>
                <Link to="/login">
                  <Button size="medium" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                    Start free trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="relative z-10 px-6 pt-32 pb-32 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
                <Icon name="sparkles" className="mr-2" size="sm" />
                AI-Powered Email Outreach
              </div>

              <h1 className="mb-8 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900">
                Get more replies with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  AI-powered
                </span>
                cold emails
              </h1>

              <p className="mb-10 text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Generate personalized cold emails in seconds with AI that researches your prospects and writes messages that actually get responses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 max-w-md mx-auto lg:mx-0">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="flex-1 px-6 py-4 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Free Trial →
                </Button>
              </div>

              <p className="text-sm text-slate-500 flex items-center justify-center lg:justify-start">
                <Icon name="check" className="mr-2 text-green-500" size="sm" />
                No credit card required • 30-day free trial
              </p>
            </div>

            {/* Right - Enhanced Visual Element */}
            <div className="relative lg:ml-20">
              <div className="relative z-10">
                {/* Main Mockup */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="h-4 bg-slate-300 rounded-lg w-32 mx-auto"></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Email Content */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <Icon name="user" className="text-blue-600" size="sm" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-300 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-24"></div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <div className="space-y-3">
                          <div className="h-4 bg-blue-400 rounded w-2/3"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-300 rounded w-full"></div>
                            <div className="h-3 bg-slate-300 rounded w-5/6"></div>
                            <div className="h-3 bg-slate-300 rounded w-4/5"></div>
                            <div className="h-3 bg-slate-300 rounded w-11/12"></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <Icon name="check" className="text-white" size="sm" />
                          </div>
                          <span className="text-sm font-medium text-green-800">AI-Personalized Content</span>
                        </div>
                        <span className="text-xs text-green-600">Ready to send</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-400">24%</div>
                          <div className="text-xs text-slate-500">Reply Rate</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-400">152</div>
                          <div className="text-xs text-slate-500">Emails Sent</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-400">8</div>
                          <div className="text-xs text-slate-500">Meetings</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">AI Research Complete</div>
                      <div className="text-xs text-slate-500">5 prospects analyzed</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Icon name="mail" className="text-white" size="sm" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Personalized</div>
                      <div className="text-xs text-slate-500">Content generated</div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-8 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon name="brain" className="text-white" size="lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
              <Icon name="sparkles" className="mr-2" size="sm" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Everything you need to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                scale your outreach
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Manage sequences, prospects, and templates with AI-powered personalization and detailed analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-10 border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Icon name="mail" className="text-white" size="lg" />
                </div>
                <h3 className="mb-6 text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Sequence Management
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                  Create and manage multi-step email sequences with scheduling, follow-ups, and performance tracking.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="clock" className="text-blue-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Sequence scheduling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="sync" className="text-blue-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Automated follow-ups</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="analytics" className="text-blue-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Performance tracking</span>
                  </div>
                </div>

                <button className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors group bg-transparent border-none cursor-pointer">
                  Learn more
                  <Icon name="arrow-right" className="ml-2 transform group-hover:translate-x-1 transition-transform" size="sm" />
                </button>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-slate-50 to-green-50 rounded-3xl p-10 border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Icon name="users" className="text-white" size="lg" />
                </div>
                <h3 className="mb-6 text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Prospect Management
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                  Import, organize, and manage your prospects with CSV upload and detailed contact information.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Icon name="upload" className="text-emerald-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">CSV import/export</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Icon name="brain" className="text-emerald-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">AI research integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Icon name="tag" className="text-emerald-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Status tracking</span>
                  </div>
                </div>

                <button className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group bg-transparent border-none cursor-pointer">
                  Learn more
                  <Icon name="arrow-right" className="ml-2 transform group-hover:translate-x-1 transition-transform" size="sm" />
                </button>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-slate-50 to-purple-50 rounded-3xl p-10 border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Icon name="template" className="text-white" size="lg" />
                </div>
                <h3 className="mb-6 text-2xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Template Library
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                  Create and manage email templates with AI-powered generation and personalization variables.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon name="robot" className="text-purple-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">AI template generation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon name="analytics" className="text-purple-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Template analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon name="code" className="text-purple-600" size="sm" />
                    </div>
                    <span className="text-slate-700 font-medium">Personalization variables</span>
                  </div>
                </div>

                <button className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors group bg-transparent border-none cursor-pointer">
                  Learn more
                  <Icon name="arrow-right" className="ml-2 transform group-hover:translate-x-1 transition-transform" size="sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
