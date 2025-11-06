import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const SignupConfirmationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="screen bg-gradient-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-glass text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-envelope text-green-600 text-2xl" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              Check Your Email
            </h1>
            <p className="text-text-secondary leading-relaxed">
              We've sent a confirmation link to your email address. Please check
              your inbox and click the link to activate your account.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => navigate("/login")}
            className="w-full py-3"
            icon={<i className="fas fa-sign-in-alt" />}
          >
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupConfirmationPage;
