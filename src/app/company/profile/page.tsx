export default function CompanyProfile() {
  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Left Side - Company Card */}
      <div className="w-full md:w-1/3 bg-gray-50 flex flex-col items-center justify-center p-6 border-r">
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {/* Company Logo Placeholder */}
          <img
            src="/company-logo.png"
            alt="Company Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-xl font-bold mt-4">Tech Solutions Co.</h2>
        <p className="text-gray-500 text-sm">Software Development Company</p>

        <div className="mt-6 space-y-3 w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Website:</span>
            <a
              href="https://techsolutions.com"
              className="text-blue-600 hover:underline"
            >
              techsolutions.com
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Email:</span>
            <a
              href="mailto:info@techsolutions.com"
              className="text-blue-600 hover:underline"
            >
              info@techsolutions.com
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Founded:</span>
            <p>2005</p>
          </div>
        </div>
      </div>

      {/* Right Side - Description & History */}
      <div className="w-full md:w-2/3 p-6">
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-green-700">
            <span>Description</span>
          </h3>
          <p className="text-gray-700 mt-2">
            Tech Solutions Co. is a leading provider of custom software
            solutions, specializing in cloud services, AI-powered applications,
            and enterprise software. We are committed to delivering
            high-quality, scalable, and cost-effective solutions to clients
            worldwide.
          </p>
        </div>

        {/* History */}
        <div className="mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-green-700">
            <span>History</span>
          </h3>
          <p className="text-gray-700 mt-2">
            Founded in 2005, Tech Solutions Co. started as a small startup with
            a vision to bring modern technology to traditional businesses. Over
            the years, the company has expanded globally, working with Fortune
            500 companies and governments to create impactful solutions.
          </p>
        </div>

        <div className="mt-6">
          <a
            href="#"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            See More...
          </a>
        </div>
      </div>
    </div>
  );
}
