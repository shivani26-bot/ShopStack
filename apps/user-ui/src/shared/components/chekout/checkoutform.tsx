import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import React, { useState } from "react";

const CheckoutForm = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string | null;
}) => {
  //   Returns the Stripe.js instance (the object that talks to Stripe’s API in the browser).
  // You need it to call methods like: stripe.confirmPayment(...),stripe.createPaymentMethod(...),stripe.retrievePaymentIntent(...)
  // Until Stripe.js finishes loading, this hook may return null. That’s why you often
  const stripe = useStripe();
  const elements = useElements();
  //   Returns the Elements instance, which manages Stripe’s UI components (like the Card input field).
  // You use this to grab the form inputs that the customer filled in:

  console.log("clientsecret", clientSecret);
  console.log("s", stripe);
  console.log("e", elements);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  console.log("cartitems", cartItems);
  const total = cartItems.reduce(
    (sum, item) => sum + item.sale_price * item.quantity,
    0
  );
  console.log("total", total);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      console.log("stripe", stripe);
      console.log("elements", elements);

      if (!stripe || !elements) {
        console.warn("Stripe or elements not loaded yet");
        setLoading(false);
        return;
      }

      console.log("inside checkout");
      // Stripe.js method: It’s used to confirm a PaymentIntent on the client side using the card info the user entered.
      // It combines:The payment method details (from your elements UI — e.g., card number, expiry, CVC). The PaymentIntent that was created server-side.
      // Basically, it’s the final step where Stripe says:
      // 👉 “Charge this customer’s card now and attach it to the right PaymentIntent.”
      const result = await stripe.confirmPayment({
        elements,
        //         elements is the Stripe Elements instance you created earlier.
        // It holds the card input fields (or other payment method fields) securely inside Stripe-managed iframes.
        // When you pass elements, Stripe automatically collects + attaches the payment method to the payment.
        confirmParams: {
          //           window.location.origin: It’s a built-in JavaScript property that returns the origin (base URL) of the current page. if app running at : https://shopstack.com/checkout?sessionId=123 then window.location.origin  // "https://shopstack.com"
          return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`, //the page the customer will be redirected to after payment confirmation.
          //  Some payments (like cards that require 3D Secure authentication) will take the user to their bank’s verification page.
          // After that, Stripe redirects them back to this URL.
          // This ensures your app knows the outcome (success or failure).
        },
      });

      if (result.error) {
        console.error("Stripe error", result.error);
        setStatus("failed");
        setErrorMsg(result.error.message || "Something went wrong.");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      setStatus("failed");
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 my-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg p-8 rounded-md shadow space-y-6"
      >
        {" "}
        <h2 className="text-3xl font-fold text-center mb-2">
          Secure Payment Checkout
        </h2>
        {/* dynamic order summary  */}
        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 space-y-3">
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm pb-1">
              <span>
                {" "}
                {item.quantity} * {item.title}{" "}
              </span>
              <span>${(item.quantity * item.sale_price).toFixed(2)}</span>
            </div>
          ))}
          {coupon && coupon?.discountAmount !== 0 && (
            <div className="flex justify-between font-semibold pt-2 border-t border-t-gray-300 mt-4">
              <>
                <span>Discount</span>
                <span className="text-green-600">
                  {" "}
                  ${(coupon?.discountAmount ?? 0).toFixed(2)}{" "}
                </span>
              </>
            </div>
          )}
          <div className="flex justify-between font-semibold mt-2">
            <span>Total</span>
            <span> ${(total - (coupon?.discountAmount ?? 0)).toFixed(2)} </span>
          </div>
        </div>
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className={`w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium transition
  ${
    !stripe || loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-400 cursor-pointer"
  }`}
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {loading ? " Processing... " : "Pay Now"}
        </button>
        {/* error comes from stripe  */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
            <XCircle className="w-5 h-5" />
            {errorMsg}{" "}
          </div>
        )}
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center ">
            <CheckCircle className="w-5 h-5" /> Payment Successful!{" "}
          </div>
        )}
        {status === "failed" && (
          <div className="flex items-center gap-2 text-red-600 text-sm justify-center ">
            <XCircle className="w-5 h-5" /> Payment Failed. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
