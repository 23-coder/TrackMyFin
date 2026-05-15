import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TrackMyFinLogo from '../components/ui/TrackMyFinLogo';
import { 
  TrendingUp, 
  PieChart, 
  Shield, 
  Smartphone, 
  DollarSign, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Target
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const features = [
    {
      icon: <PieChart className="w-8 h-8" />,
      title: "Expense Tracking",
      description: "Categorize and track your expenses with beautiful visualizations"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Income Management",
      description: "Monitor your income streams and track financial growth"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Gain insights with detailed charts and financial reports"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your financial data is encrypted and completely secure"
    }
  ];

  const stats = [
    { icon: <Users className="w-6 h-6" />, number: "10K+", label: "Active Users" },
    { icon: <DollarSign className="w-6 h-6" />, number: "$2M+", label: "Tracked" },
    { icon: <Clock className="w-6 h-6" />, number: "24/7", label: "Support" },
    { icon: <Target className="w-6 h-6" />, number: "99%", label: "Accuracy" }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 opacity-10"></div>
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <div className="flex justify-center mb-8">
                <TrackMyFinLogo 
                  size="hero"
                  showText={false}
                  animated={true}
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TrackMyFin
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform your financial future with intelligent tracking, insightful analytics, and beautiful visualizations
              </p>
            </div>
            
            {user ? (
              <div className="animate-fade-in-up animation-delay-200 space-y-6">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-2xl font-semibold mb-2">Welcome back, {user.firstName}!</h2>
                  <p className="text-lg opacity-90">Ready to take control of your finances?</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/dashboard"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/analytics"
                    className="group border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    View Analytics
                    <BarChart3 className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up animation-delay-200 space-y-8">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Join thousands of users who have transformed their financial lives
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/about"
                    className="group border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    Learn More
                    <CheckCircle className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Smart Finance</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage your money effectively in one beautiful, intuitive platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className={`py-20 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Financial Journey?</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have transformed their relationship with money
            </p>
            <Link
              to="/register"
              className="group inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Start Free Today
              <Smartphone className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;