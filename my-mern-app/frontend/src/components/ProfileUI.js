import React, { useState } from 'react';

const ProfileUI = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    bio: 'Student at Purdue',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleEdit = () => setIsEditing(true);
  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // Handle form submission (will connect to backend API later)
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Optionally, reset the profile state to original values if needed
  };

  return (
    <div className="profile-ui">
      <h2>Profile</h2>
      <form onSubmit={handleSave}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <label htmlFor="bio">Bio</label>
          <input
            type="text"
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          {isEditing ? (
            <>
              <button type="submit">Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button type="button" onClick={handleEdit}>Edit</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileUI;