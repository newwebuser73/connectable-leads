import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, BarChart3, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6">
              <TrendingUp className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Lead Management
            <span className="block text-blue-200">CRM Platform</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Streamline your sales process, track leads efficiently, and close more deals 
            with our comprehensive customer relationship management platform.
          </p>
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-glow text-lg px-8 py-3"
            onClick={() => navigate('/auth')}
          >
            Get Started Today
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Users className="h-12 w-12 text-blue-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Lead Management</h3>
            <p className="text-blue-100">
              Organize and track all your leads in one centralized platform.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Pipeline Tracking</h3>
            <p className="text-blue-100">
              Visualize your sales pipeline and track deal progress.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Target className="h-12 w-12 text-blue-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
            <p className="text-blue-100">
              Assign leads, track activities, and collaborate with your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
