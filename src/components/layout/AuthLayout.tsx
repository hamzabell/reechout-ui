import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showBackButton?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = true,
}) => {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden">
      {/* Left side - Form (fixed height, scrollable if needed) */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {showBackButton && (
            <div className="mb-3">
              <Link
                to="/"
                className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200 group"
              >
                <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
          )}

          {/* Logo and Brand */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-3">
              <img
                src="/logo.svg"
                alt="Reechout Logo"
                className="w-8 h-8"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo192.png";
                }}
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Reechout
            </h1>
          </div>

          {/* Form Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
            <p className="text-slate-600 text-sm">{subtitle}</p>
          </div>

          {/* Form Content - No container wrapper */}
          {children}
        </div>
      </div>

      {/* Right side - Marketing Content (Desktop only, fixed, no scroll) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Content - Centered and fixed to fit screen */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white h-full">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Transform Your Cold Emails with AI
            </h2>
            <p className="text-lg mb-8 text-blue-100 leading-relaxed">
              Personalize every email at scale. Increase reply rates by up to
              400% with our AI-powered personalization platform.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-robot text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    AI-Powered Personalization
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Generate unique, personalized content for each recipient
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-chart-line text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Boost Reply Rates</h3>
                  <p className="text-blue-100 text-sm">
                    See up to 4x improvement in your email response rates
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-users text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Scale Your Outreach</h3>
                  <p className="text-blue-100 text-sm">
                    Send thousands of personalized emails without manual effort
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <div className="text-2xl font-bold mb-1">400%</div>
                <div className="text-blue-100 text-xs">Higher Reply Rates</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">10K+</div>
                <div className="text-blue-100 text-xs">Emails Sent Daily</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">98%</div>
                <div className="text-blue-100 text-xs">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm animate-float"></div>
        <div
          className="absolute bottom-20 left-10 w-24 h-24 bg-white/5 rounded-full backdrop-blur-sm animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-16 w-12 h-12 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
};

export default AuthLayout;
