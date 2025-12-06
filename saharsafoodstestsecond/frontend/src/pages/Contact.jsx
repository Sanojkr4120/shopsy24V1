import React from 'react';

const Contact = () => {
    return (
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-orange-500">Contact Us</h2>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                <p className="text-xl mb-4">We'd love to hear from you!</p>
                <p className="text-gray-400 mb-6">For orders, feedback, or just to say hello.</p>

                <div className="space-y-4 text-left inline-block">
                    <p><strong>📍 Address:</strong> Saharsa, Bihar, India</p>
                    <p><strong>📞 Phone:</strong> +91 98765 43210</p>
                    <p><strong>📧 Email:</strong> hello@saharsafoods.com</p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
