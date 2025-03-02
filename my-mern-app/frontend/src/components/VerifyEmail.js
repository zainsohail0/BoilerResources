import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { id, token } = useParams();
  const [status, setStatus] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5001/api/auth/verify-email/${id}/${token}`
        );

        if (response.status === 200) {
          setStatus("Your email has been verified successfully!");
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate("/login?verified=true");
          }, 3000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to verify email. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [id, token, navigate]);

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      {/* Top Bar */}
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
        BoileResources
      </div>

      <div className="flex justify-center items-center h-full">
        <div className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg text-center">
          <h2 className="text-xl font-bold mb-4">Email Verification</h2>

          {error ? (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <div className="mt-4">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Return to Login
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
