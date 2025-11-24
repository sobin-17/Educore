import React from 'react';
import { checkQuizCompletion, checkCertificateStatus, generateCertificate, downloadCertificate } from './api';

const CertificateButton = ({ courseId, userId }) => {
    const handleDownload = async () => {
        try {
            // Check quiz completion
            const isCompleted = await checkQuizCompletion(courseId);
            if (!isCompleted) {
                alert('Please complete all quizzes to generate a certificate.');
                return;
            }

            // Check certificate status
            const status = await checkCertificateStatus(courseId, userId);
            if (!status.exists) {
                alert('No certificate found. Generating one now...');
                await generateCertificate(courseId);
            }

            // Download certificate
            await downloadCertificate(courseId, userId);
            alert('Certificate downloaded successfully!');
        } catch (error) {
            console.error('Certificate button error:', error);
            alert(`Error: ${error.message || 'Failed to process certificate'}`);
        }
    };

    return (
        <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
            Download Certificate
        </button>
    );
};

export default CertificateButton;