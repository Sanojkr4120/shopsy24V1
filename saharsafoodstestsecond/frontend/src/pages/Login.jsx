import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (values, { setSubmitting }) => {
        const userData = await login(values.email, values.password);
        if (userData) {
            if (userData.role === 'admin') {
                navigate('/admin');
            } else if (userData.role === 'employee') {
                navigate('/employee');
            } else {
                navigate('/');
            }
        }
        setSubmitting(false);
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-orange-500">Welcome Back</h2>

                <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form className="space-y-6">
                            <div>
                                <label className="block text-gray-400 mb-2">Email Address</label>
                                <Field
                                    type="email"
                                    name="email"
                                    className={`w-full bg-gray-700 border rounded p-3 focus:outline-none focus:border-orange-500 ${errors.email && touched.email ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                />
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Password</label>
                                <Field
                                    type="password"
                                    name="password"
                                    className={`w-full bg-gray-700 border rounded p-3 focus:outline-none focus:border-orange-500 ${errors.password && touched.password ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400 hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full font-bold py-3 rounded-lg transition ${isSubmitting
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                    }`}
                            >
                                {isSubmitting ? 'Logging in...' : 'Login'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <p className="mt-4 text-center text-gray-400">
                    Don't have an account? <Link to="/register" className="text-orange-500 hover:underline">Register</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
