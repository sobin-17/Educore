import React, { createContext, useContext, useState } from 'react';

const CourseContext = createContext();

export const useCourses = () => {
  return useContext(CourseContext);
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const fetchCourses = async () => {
    // Mock data - replace with API call
    const mockCourses = [
      {
        id: 1,
        title: 'React Fundamentals',
        description: 'Learn React from basics to advanced',
        instructor: 'John Smith',
        duration: '8 weeks',
        price: 99,
        image: '/api/placeholder/300/200',
        rating: 4.5,
        students: 1234
      },
      {
        id: 2,
        title: 'JavaScript Mastery',
        description: 'Complete JavaScript course for beginners',
        instructor: 'Jane Doe',
        duration: '12 weeks',
        price: 149,
        image: '/api/placeholder/300/200',
        rating: 4.8,
        students: 2156
      }
    ];
    setCourses(mockCourses);
  };

  const enrollInCourse = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course && !enrolledCourses.find(c => c.id === courseId)) {
      setEnrolledCourses([...enrolledCourses, { ...course, enrolledAt: new Date() }]);
    }
  };

  const value = {
    courses,
    enrolledCourses,
    fetchCourses,
    enrollInCourse
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};