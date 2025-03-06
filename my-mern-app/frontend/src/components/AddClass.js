import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const API_URL = "http://localhost:5001";
const MAX_CREDIT_HOURS = 23;

const AddClass = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [userId, setUserId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAddingClass, setIsAddingClass] = useState(false);

  // Filter states
  const [subjects, setSubjects] = useState([]);
  const [creditOptions, setCreditOptions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [invalidFilterMessage, setInvalidFilterMessage] = useState("");

  // Create a ref for scrolling to top
  const topRef = useRef(null);

  // Function to scroll to top
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to extract subject from course code
  const getSubjectFromCode = (code) => {
    if (!code) return "General";
    const match = code.match(/^([A-Z]+)/);
    return match ? match[0] : "General";
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Courses fetch failed: ${response.status}`);
        }

        const coursesData = await response.json();
        setSearchResults(coursesData);
        setFilteredResults(coursesData);

        // Extract unique filter values
        const subjectSet = new Set(
          coursesData.map(
            (course) => course.subject || getSubjectFromCode(course.courseCode)
          )
        );
        // Use standard credit options 1-5 instead of extracting from data
        const creditOptions = [1, 2, 3, 4, 5];
        const typeSet = new Set(
          coursesData.map((course) => course.type || "General")
        );

        setSubjects(Array.from(subjectSet));
        setCreditOptions(creditOptions);
        setClassTypes(Array.from(typeSet));
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchCourses();

    // Load saved filter preferences
    const savedSubjects =
      JSON.parse(localStorage.getItem("filterSubjects")) || [];
    const savedCredits =
      JSON.parse(localStorage.getItem("filterCredits")) || [];
    const savedTypes = JSON.parse(localStorage.getItem("filterTypes")) || [];

    setSelectedSubjects(savedSubjects);
    setSelectedCredits(savedCredits.map(Number));
    setSelectedClassTypes(savedTypes);
  }, []);

  useEffect(() => {
    // Load existing user classes
    const classes = JSON.parse(localStorage.getItem("userClasses")) || [];
    setUserClasses(classes.filter((classItem) => !classItem.completed));
    setCompletedClasses(classes.filter((classItem) => classItem.completed));
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError("Unauthorized: Please log in");
            navigate("/login");
            return;
          }
          throw new Error(
            `Authentication failed with status: ${response.status}`
          );
        }

        const userData = await response.json();

        if (userData && userData._id) {
          setUserId(userData._id);
          fetchUserClasses(userData._id);
        } else {
          setAuthError("No user information found");
          navigate("/login");
        }
      } catch (error) {
        setAuthError(error.message);
        navigate("/login");
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Apply search and filters
  useEffect(() => {
    // Clear any previous invalid filter messages
    setInvalidFilterMessage("");

    let results = [...searchResults];

    // Apply search term filter
    if (searchTerm.trim() !== "") {
      results = results.filter(
        (classItem) =>
          (classItem.courseCode &&
            classItem.courseCode
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (classItem.title &&
            classItem.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply subject filter if any are selected
    if (selectedSubjects.length > 0) {
      results = results.filter((classItem) => {
        const subject =
          classItem.subject || getSubjectFromCode(classItem.courseCode);
        return selectedSubjects.includes(subject);
      });
    }

    // Apply credits filter if any are selected
    if (selectedCredits.length > 0) {
      results = results.filter(
        (classItem) =>
          classItem.creditHours &&
          selectedCredits.includes(classItem.creditHours)
      );
    }

    // Apply class type filter if any are selected
    if (selectedClassTypes.length > 0) {
      results = results.filter((classItem) =>
        selectedClassTypes.includes(classItem.type || "General")
      );
    }

    // Check if filters produced no results
    if (
      hasActiveFilters() &&
      results.length === 0 &&
      searchResults.length > 0
    ) {
      setInvalidFilterMessage(
        "No classes match your filter criteria. Try adjusting your filters."
      );
    }

    setFilteredResults(results);
  }, [
    searchTerm,
    selectedSubjects,
    selectedCredits,
    selectedClassTypes,
    searchResults,
  ]);

  const fetchUserClasses = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/courses/user/${id}/enrolled`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user classes: ${response.status}`);
      }

      const classes = await response.json();
      setUserClasses(classes);

      // Calculate total credits
      const credits = classes.reduce(
        (sum, classItem) => sum + (classItem.creditHours || 0),
        0
      );
      setTotalCredits(credits);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Helper to check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedSubjects.length > 0 ||
      selectedCredits.length > 0 ||
      selectedClassTypes.length > 0
    );
  };

  // Toggle filter selection
  const toggleSubjectFilter = (subject) => {
    const updatedSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((s) => s !== subject)
      : [...selectedSubjects, subject];

    setSelectedSubjects(updatedSubjects);
    localStorage.setItem("filterSubjects", JSON.stringify(updatedSubjects));
  };

  const toggleCreditFilter = (credit) => {
    const updatedCredits = selectedCredits.includes(credit)
      ? selectedCredits.filter((c) => c !== credit)
      : [...selectedCredits, credit];

    setSelectedCredits(updatedCredits);
    localStorage.setItem("filterCredits", JSON.stringify(updatedCredits));
  };

  const toggleClassTypeFilter = (type) => {
    const updatedTypes = selectedClassTypes.includes(type)
      ? selectedClassTypes.filter((t) => t !== type)
      : [...selectedClassTypes, type];

    setSelectedClassTypes(updatedTypes);
    localStorage.setItem("filterTypes", JSON.stringify(updatedTypes));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSubjects([]);
    setSelectedCredits([]);
    setSelectedClassTypes([]);
    setInvalidFilterMessage("");

    // Clear saved preferences
    localStorage.removeItem("filterSubjects");
    localStorage.removeItem("filterCredits");
    localStorage.removeItem("filterTypes");
  };

  const handleRemoveClass = (classCode) => {
    const updatedClasses = userClasses.filter((c) => c.code !== classCode);
    const updatedCompletedClasses = completedClasses.filter(
      (c) => c.code !== classCode
    );
    setUserClasses(updatedClasses);
    setCompletedClasses(updatedCompletedClasses);
    localStorage.setItem(
      "userClasses",
      JSON.stringify([...updatedClasses, ...updatedCompletedClasses])
    );
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddClass = async (classItem) => {
    if (!userId) {
      setErrorMessage("User ID not found. Please log in again.");
      scrollToTop();
      return;
    }

    // Check if adding this class would exceed the credit limit
    const classCredits = classItem.creditHours || 0;
    const newTotalCredits = totalCredits + classCredits;

    if (newTotalCredits > MAX_CREDIT_HOURS) {
      setErrorMessage(
        `Cannot add this class. Adding ${classItem.courseCode} (${classCredits} credits) would exceed the maximum of ${MAX_CREDIT_HOURS} credit hours. You currently have ${totalCredits} credits.`
      );
      scrollToTop(); // Scroll to top so user can see the error message
      return;
    }

    // Prevent multiple simultaneous adds
    if (isAddingClass) return;

    setIsAddingClass(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_URL}/api/courses/user/${userId}/enroll`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: classItem._id }),
          credentials: "include",
        }
      );

      // Optimistically update the UI to show class was added
      const updatedClasses = [...userClasses];
      if (!userClasses.some((c) => c._id === classItem._id)) {
        updatedClasses.push(classItem);
        setUserClasses(updatedClasses);
        setTotalCredits(newTotalCredits); // Update total credits immediately
      }

      setSuccessMessage(`Successfully added ${classItem.courseCode}`);
      scrollToTop(); // Scroll to top to show success message

      // Refresh the user classes list from server to ensure accuracy
      fetchUserClasses(userId);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error adding course:", err);
      // Even if there's an error, we still refresh the class list
      // to see if the class was actually added despite the error
      fetchUserClasses(userId);
    } finally {
      setIsAddingClass(false);
    }
  };

  return (

    <div className="min-h-screen bg-gray-100">
      <div ref={topRef}></div>
      <nav className="bg-yellow-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">
                BoileResources
              </span>
            </div>
            <button
              onClick={handleGoBack}
              className="text-white bg-black px-2 py-1.5 test-sm rounded-lg hover:bg-gray-800 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Search and Add Classes</h1>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold">
              Current Credit Hours: {totalCredits} / {MAX_CREDIT_HOURS}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  totalCredits > MAX_CREDIT_HOURS ? "bg-red-600" : "bg-blue-600"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (totalCredits / MAX_CREDIT_HOURS) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by class code or name (e.g., CS18000 or Calculus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-700 dark:focus:ring-yellow-500"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 transition flex items-center"
            >
              {filtersVisible ? "Hide Filters" : "Show Filters"}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                ></path>
              </svg>
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-800 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Filters Section */}
          {filtersVisible && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subject Filter */}
                <div>
                  <h3 className="font-semibold mb-2">Filter by Subject</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <label key={subject} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => toggleSubjectFilter(subject)}
                            className="mr-2 h-4 w-4 text-yellow-700 focus:ring-yellow-700 rounded"
                          />
                          {subject}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Loading subjects...
                      </p>
                    )}
                  </div>
                </div>

                {/* Credits Filter */}
                <div>
                  <h3 className="font-semibold mb-2">Filter by Credits</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {creditOptions.map((credit) => (
                        <label key={credit} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCredits.includes(credit)}
                            onChange={() => toggleCreditFilter(credit)}
                            className="mr-2 h-4 w-4 text-yellow-700 focus:ring-yellow-700 rounded"
                          />
                          {credit} {credit === 1 ? "Credit" : "Credits"}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Class Type Filter */}
                <div>
                  <h3 className="font-semibold mb-2">Filter by Class Type</h3>
                  <div className="space-y-2">
                    {classTypes.length > 0 ? (
                      classTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedClassTypes.includes(type)}
                            onChange={() => toggleClassTypeFilter(type)}
                            className="mr-2 h-4 w-4 text-yellow-700 focus:ring-yellow-700 rounded"
                          />
                          {type}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Loading class types...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter indicator */}
              {hasActiveFilters() && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p>
                    Active filters:
                    {selectedSubjects.length > 0 &&
                      ` Subjects (${selectedSubjects.length})`}
                    {selectedCredits.length > 0 &&
                      ` Credits (${selectedCredits.length})`}
                    {selectedClassTypes.length > 0 &&
                      ` Types (${selectedClassTypes.length})`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Invalid Filter Message */}
          {invalidFilterMessage && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
              {invalidFilterMessage}
            </div>
          )}

          <div className="mb-8 mt-4">
            <h2 className="text-xl font-semibold mb-4">
              Search Results{" "}
              {filteredResults.length > 0 && `(${filteredResults.length})`}
            </h2>

            {searchResults.length === 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p>Loading classes from database...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-4">
                {filteredResults.map((classItem) => {
                  if (!classItem) return null; // Skip null or undefined items

                  const isAdded = userClasses.some(
                    (c) => c._id === classItem._id
                  );
                  const subject =
                    classItem.subject ||
                    getSubjectFromCode(classItem.courseCode);
                  const type = classItem.type || "General";

                  return (
                    <div
                      key={classItem._id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {classItem.courseCode}
                        </h3>
                        <p>{classItem.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-sm text-gray-600">
                            Credits: {classItem.creditHours || "N/A"}
                          </span>
                          <span className="text-sm text-blue-600">
                            {subject}
                          </span>
                          <span className="text-sm text-green-600">{type}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddClass(classItem)}
                          disabled={isAdded || isAddingClass}
                          className={`px-4 py-2 rounded-lg ${
                            isAdded || isAddingClass
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-yellow-700 text-white hover:bg-yellow-800"
                          } transition`}
                        >
                          {isAdded
                            ? "Added"
                            : isAddingClass
                            ? "Adding..."
                            : "Add Class"}
                        </button>
                        <button
                          onClick={() => navigate(`/class/${classItem._id}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 p-4 border rounded-lg">
                {searchTerm.trim() === "" && !hasActiveFilters()
                  ? "Type in the search box or use filters to find classes"
                  : "No classes found matching your criteria. Try adjusting your search or filters."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClass;
