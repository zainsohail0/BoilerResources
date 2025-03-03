import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileUI = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    bio: 'Student at Purdue',
    position: 'Student',
    grade: 'A',
    major: 'Computer Science',
  });
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log("isEditing state changed:", isEditing);
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    if (!profile.name) newErrors.name = "Name is required";
    if (!profile.email) newErrors.email = "Email is required";
    if (!profile.bio) newErrors.bio = "Bio is required";
    if (!profile.position) newErrors.position = "Position is required";
    if (!profile.grade) newErrors.grade = "Grade is required";
    if (!profile.major) newErrors.major = "Major is required";
    return newErrors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await axios.put('/api/profile/update', profile);
      setMessage(response.data.message);
      setOriginalProfile(profile); // Update original profile to the new saved profile
      setIsEditing(false);
    } catch (error) {
      setMessage(error.response.data.message || 'Error updating profile');
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked!"); // Debugging log
    setProfile(originalProfile); // Reset profile to original values
    setIsEditing(false);
    setMessage(''); // Clear the message
  };

  const handleEdit = () => {
    console.log("Edit button clicked!"); // Debugging log
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Profile</h2>
        </div>
        {message && <p className="text-center text-green-500">{message}</p>}
        <form key={isEditing ? "editing" : "viewing"} className="mt-8 space-y-6" onSubmit={handleSave}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="flex items-center">
              <label htmlFor="name" className="w-1/4">Name:</label>
              <input
                id="name"
                name="name"
                type="text"
                value={profile.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="flex items-center">
              <label htmlFor="email" className="w-1/4">Email:</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="flex items-center">
              <label htmlFor="bio" className="w-1/4">Bio:</label>
              <input
                id="bio"
                name="bio"
                type="text"
                value={profile.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Bio"
              />
              {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
            </div>
            <div className="flex items-center">
              <label htmlFor="position" className="w-1/4">Position:</label>
              <input
                id="position"
                name="position"
                type="text"
                value={profile.position}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Position"
              />
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>
            <div className="flex items-center">
              <label htmlFor="grade" className="w-1/4">Grade:</label>
              <input
                id="grade"
                name="grade"
                type="text"
                value={profile.grade}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Grade"
              />
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
            </div>
            <div className="flex items-center">
              <label htmlFor="major" className="w-1/4">Major:</label>
              <input
                id="major"
                name="major"
                type="text"
                value={profile.major}
                onChange={handleChange}
                disabled={!isEditing}
                className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200" : "bg-white"}`}
                placeholder="Major"
              />
              {errors.major && <p className="text-red-500 text-xs mt-1">{errors.major}</p>}
            </div>
          </div>

          <div>
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUI;