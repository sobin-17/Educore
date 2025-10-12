import React from 'react';
import { Phone, Mail } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">About EduCore</h1>
          <p className="text-xl opacity-90">
            Empowering learners worldwide with quality education and innovative learning experiences.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://placehold.co/600x400/2563eb/ffffff?text=Learning"
              alt="Our Mission"
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              At EduCore, our mission is to make education accessible to everyone, everywhere. 
              We connect students with expert instructors and provide a world-class online learning experience.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-4xl font-bold text-blue-600 mb-2">50k+</h3>
            <p className="text-gray-600">Students Worldwide</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-blue-600 mb-2">1000+</h3>
            <p className="text-gray-600">Expert Instructors</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-blue-600 mb-2">2000+</h3>
            <p className="text-gray-600">Courses Offered</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">Meet Our Team</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[

            { name: "Dhananjay", role: "Co-Founder", phone: "+91 98765 43210", email: "dhananjay@edu.com" },
            { name: "Anjali", role: "Instructor Lead", phone: "+91 87654 32109", email: "anjali@edu.com" },
            { name: "Sandra", role: "Community Manager", phone: "+91 76543 21098", email: "sandra@edu.com" },
            { name: "Sobin", role: "Technical Lead", phone: "+91 65432 10987", email: "sobin@edu.com" },
          ].map((member, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-2xl transition-transform hover:-translate-y-2"
            >
              <img
                src={`https://placehold.co/200x200/2563eb/ffffff?text=${member.name[0]}`}
                alt={member.name}
                className="w-32 h-32 mx-auto rounded-full mb-4 object-cover border-4 border-blue-500"
              />
              <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
              <p className="text-blue-600 font-medium">{member.role}</p>
              <div className="mt-4 space-y-2 text-gray-700">
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
