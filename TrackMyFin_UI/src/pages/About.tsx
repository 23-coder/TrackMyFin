import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Users,
  Target,
  CheckCircle,
  Lock,
  Zap
} from 'lucide-react';

const About: React.FC = () => {
  const { isDark } = useTheme();

  const features = [
    {
      icon: <PieChart className="w-8 h-8" />,
      title: "Smart Categorization",
      description: "Automatically categorize transactions and visualize spending patterns with beautiful charts and insights."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Financial Analytics",
      description: "Track your financial growth with detailed analytics, trends, and performance metrics."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Budget Management",
      description: "Set and monitor budgets across different categories to stay on track with your financial goals."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Level Security",
      description: "Your financial data is protected with enterprise-grade encryption and security measures."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Responsive",
      description: "Access your finances anywhere with our fully responsive design that works on all devices."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-User Support",
      description: "Share budgets and track expenses with family members or business partners securely."
    }
  ];

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Goal Achievement",
      description: "Set financial goals and track your progress with visual indicators and milestones."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Privacy First",
      description: "Your data belongs to you. We never sell or share your personal financial information."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Updates",
      description: "Get instant updates and notifications about your spending and account activity."
    }
  ];

  return (
    <div className="transition-colors duration-200">
      {/* Hero Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fadeInUp">
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Finance Tracker</span>
            </h1>
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Empowering individuals and families to take control of their financial future through intelligent tracking, 
              insightful analytics, and beautiful visualizations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slideInLeft">
              <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Our Mission
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                We believe that everyone deserves access to powerful financial tools that help them understand their money, 
                make informed decisions, and achieve their financial goals.
              </p>
              <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Finance Tracker was built from the ground up to be intuitive, secure, and powerful enough for both 
                personal finance management and small business accounting needs.
              </p>
              <div className="flex items-center space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Trusted by 10,000+ users worldwide</span>
              </div>
            </div>
            <div className="animate-slideInRight">
              <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">$2M+</div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Money Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Powerful Features for Smart Finance
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Everything you need to manage your money effectively in one beautiful, intuitive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Finance Tracker?
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We're committed to providing you with the best financial management experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`text-center p-8 rounded-2xl transition-all duration-300 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                  <div className="text-blue-600 dark:text-blue-400">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fadeInUp">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Join thousands of users who have transformed their financial lives with Finance Tracker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                Get Started Free
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-white hover:text-blue-600">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;