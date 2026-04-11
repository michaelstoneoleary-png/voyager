export default function SmsConsent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">bon VOYAGER — SMS Consent & Opt-In Policy</h1>
          <p className="text-sm text-gray-500">Last updated: February 17, 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What is bon VOYAGER?</h2>
            <p>
              bon VOYAGER is an AI-powered travel planning application that helps users plan trips, 
              build packing lists, discover destinations, and manage their journeys. As part of 
              our service, we offer the ability to share packing lists and travel information 
              via SMS text message.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">SMS Opt-In Consent</h2>
            <p>
              By providing your phone number and clicking "Send" or "Share via SMS" within the 
              bon VOYAGER application, you expressly consent to receive a one-time SMS text message 
              from bon VOYAGER containing the information you requested (such as a packing list or 
              travel details). Your consent is given at the time you initiate the SMS share action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Types of Messages</h2>
            <p>bon VOYAGER sends the following types of SMS messages:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Packing list sharing</strong> — A one-time message containing a link to view your packing list</li>
              <li><strong>Travel information sharing</strong> — A one-time message containing travel details you chose to share</li>
            </ul>
            <p className="mt-3">
              These are transactional, user-initiated messages only. We do not send marketing, 
              promotional, or recurring messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Message Frequency</h2>
            <p>
              SMS messages are sent only when you explicitly request them by using the "Share via SMS" 
              feature. Message frequency depends entirely on your usage. No automatic or recurring 
              messages are sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Opt-Out</h2>
            <p>
              Since messages are one-time and user-initiated, you can opt out simply by not using the 
              SMS share feature. You may also reply <strong>STOP</strong> to any message received from 
              bon VOYAGER to prevent future messages. After opting out, you will receive a single 
              confirmation message acknowledging your request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Help</h2>
            <p>
              For help or questions about SMS messaging, reply <strong>HELP</strong> to any message 
              from bon VOYAGER, or contact us at the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Costs</h2>
            <p>
              Message and data rates may apply. bon VOYAGER does not charge for SMS messages, but your 
              mobile carrier's standard messaging rates may apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Privacy</h2>
            <p>
              Phone numbers provided for SMS sharing are used solely to deliver the requested message. 
              We do not sell, rent, or share phone numbers with third parties for marketing purposes. 
              Phone numbers are not stored beyond what is necessary to send the requested message. 
              For more information, please see our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Supported Carriers</h2>
            <p>
              SMS messaging is supported on all major US carriers including AT&T, Verizon, T-Mobile, 
              Sprint, and most regional carriers. Carriers are not liable for delayed or undelivered messages.
            </p>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p>
              If you have questions about our SMS practices, please contact us through the bon VOYAGER application.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} bon VOYAGER — Travel Without Limits</p>
        </div>
      </div>
    </div>
  );
}
