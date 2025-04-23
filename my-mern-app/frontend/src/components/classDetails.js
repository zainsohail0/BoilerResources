import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [otherClasses, setOtherClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [professorOptions, setProfessorOptions] = useState(null);
  const professorOptionsRef = useRef(null);
  
  // Section state
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("all");
  
  // Grade distribution state
  const [gradeData, setGradeData] = useState([]);
  const [averageGrade, setAverageGrade] = useState('');

  // Wrap constant objects in useMemo to prevent re-creation on every render
  const gradeValues = useMemo(() => ({
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  }), []);
  
  // Wrap array in useMemo to prevent re-creation on every render
  const gradeLetters = useMemo(() => 
    ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
  []);
  
  // Wrap functions in useCallback to prevent re-creation on every render
  const getGradeColor = useCallback((grade) => {
    if (grade.startsWith('A')) return '#4CAF50'; // Green
    if (grade.startsWith('B')) return '#2196F3'; // Blue
    if (grade.startsWith('C')) return '#FF9800'; // Orange
    if (grade.startsWith('D')) return '#F44336'; // Red
    return '#9C27B0'; // Purple for F
  }, []);
  
  // Wrap functions in useCallback to prevent re-creation on every render
  const getLetterGrade = useCallback((value) => {
    if (value >= 4.0) return 'A';
    if (value >= 3.7) return 'A-';
    if (value >= 3.3) return 'B+';
    if (value >= 3.0) return 'B';
    if (value >= 2.7) return 'B-';
    if (value >= 2.3) return 'C+';
    if (value >= 2.0) return 'C';
    if (value >= 1.7) return 'C-';
    if (value >= 1.3) return 'D+';
    if (value >= 1.0) return 'D';
    if (value >= 0.7) return 'D-';
    return 'F';
  }, []);

  // Generate random grade distribution with specific target average
  const generateDistributionWithAverage = useCallback((targetGrade) => {
    // Start with empty counts
    let counts = Array(gradeLetters.length).fill(0);
    let targetValue = 0;
    
    // Map target grade to numerical value
    switch(targetGrade) {
      case 'A':
        targetValue = 4.0;
        break;
      case 'A-':
        targetValue = 3.7;
        break;
      case 'B+':
        targetValue = 3.3;
        break;
      case 'B':
        targetValue = 3.0;
        break;
      case 'B-':
        targetValue = 2.7;
        break;
      case 'C+':
        targetValue = 2.3;
        break;
      default:
        targetValue = 3.3; // Default to B+
    }
    
    // Set distribution base on target grade
    if (targetGrade === 'A' || targetGrade === 'A-') {
      // Higher distribution for A's
      for (let i = 0; i < 100; i++) {
        let randomValue = Math.floor(Math.random() * 100);
        let gradeIndex;
        
        if (randomValue < 10) gradeIndex = 0; // A+ (10%)
        else if (randomValue < 30) gradeIndex = 1; // A (20%)
        else if (randomValue < 45) gradeIndex = 2; // A- (15%)
        else if (randomValue < 60) gradeIndex = 3; // B+ (15%)
        else if (randomValue < 75) gradeIndex = 4; // B (15%)
        else if (randomValue < 85) gradeIndex = 5; // B- (10%)
        else if (randomValue < 90) gradeIndex = 6; // C+ (5%)
        else if (randomValue < 95) gradeIndex = 7; // C (5%)
        else if (randomValue < 97) gradeIndex = 8; // C- (2%)
        else if (randomValue < 99) gradeIndex = 9; // D+ (2%)
        else gradeIndex = 12; // F (1%)
        
        counts[gradeIndex]++;
      }
    } else if (targetGrade === 'B+') {
      // B+ centered distribution
      for (let i = 0; i < 100; i++) {
        let randomValue = Math.floor(Math.random() * 100);
        let gradeIndex;
        
        if (randomValue < 3) gradeIndex = 0; // A+ (3%)
        else if (randomValue < 10) gradeIndex = 1; // A (7%)
        else if (randomValue < 20) gradeIndex = 2; // A- (10%)
        else if (randomValue < 45) gradeIndex = 3; // B+ (25%)
        else if (randomValue < 60) gradeIndex = 4; // B (15%)
        else if (randomValue < 70) gradeIndex = 5; // B- (10%)
        else if (randomValue < 77) gradeIndex = 6; // C+ (7%)
        else if (randomValue < 84) gradeIndex = 7; // C (7%)
        else if (randomValue < 90) gradeIndex = 8; // C- (6%)
        else if (randomValue < 94) gradeIndex = 9; // D+ (4%)
        else if (randomValue < 97) gradeIndex = 10; // D (3%)
        else if (randomValue < 99) gradeIndex = 11; // D- (2%)
        else gradeIndex = 12; // F (1%)
        
        counts[gradeIndex]++;
      }
    } else if (targetGrade === 'B' || targetGrade === 'B-') {
      // B centered distribution
      for (let i = 0; i < 100; i++) {
        let randomValue = Math.floor(Math.random() * 100);
        let gradeIndex;
        
        if (randomValue < 2) gradeIndex = 0; // A+ (2%)
        else if (randomValue < 7) gradeIndex = 1; // A (5%)
        else if (randomValue < 15) gradeIndex = 2; // A- (8%)
        else if (randomValue < 28) gradeIndex = 3; // B+ (13%)
        else if (randomValue < 48) gradeIndex = 4; // B (20%)
        else if (randomValue < 63) gradeIndex = 5; // B- (15%)
        else if (randomValue < 73) gradeIndex = 6; // C+ (10%)
        else if (randomValue < 83) gradeIndex = 7; // C (10%)
        else if (randomValue < 90) gradeIndex = 8; // C- (7%)
        else if (randomValue < 94) gradeIndex = 9; // D+ (4%)
        else if (randomValue < 97) gradeIndex = 10; // D (3%)
        else if (randomValue < 99) gradeIndex = 11; // D- (2%)
        else gradeIndex = 12; // F (1%)
        
        counts[gradeIndex]++;
      }
    } else {
      // C+ centered distribution
      for (let i = 0; i < 100; i++) {
        let randomValue = Math.floor(Math.random() * 100);
        let gradeIndex;
        
        if (randomValue < 1) gradeIndex = 0; // A+ (1%)
        else if (randomValue < 3) gradeIndex = 1; // A (2%)
        else if (randomValue < 8) gradeIndex = 2; // A- (5%)
        else if (randomValue < 15) gradeIndex = 3; // B+ (7%)
        else if (randomValue < 25) gradeIndex = 4; // B (10%)
        else if (randomValue < 35) gradeIndex = 5; // B- (10%)
        else if (randomValue < 60) gradeIndex = 6; // C+ (25%)
        else if (randomValue < 75) gradeIndex = 7; // C (15%)
        else if (randomValue < 85) gradeIndex = 8; // C- (10%)
        else if (randomValue < 90) gradeIndex = 9; // D+ (5%)
        else if (randomValue < 95) gradeIndex = 10; // D (5%)
        else if (randomValue < 98) gradeIndex = 11; // D- (3%)
        else gradeIndex = 12; // F (2%)
        
        counts[gradeIndex]++;
      }
    }
    
    // Create the data object for chart
    const data = gradeLetters.map((grade, index) => ({
      grade,
      students: counts[index],
      fill: getGradeColor(grade)
    }));
    
    // Calculate average grade
    let totalPoints = 0;
    let totalStudents = 0;
    
    data.forEach(item => {
      totalPoints += gradeValues[item.grade] * item.students;
      totalStudents += item.students;
    });
    
    const avgGradeValue = totalPoints / totalStudents;
    const calculatedGrade = getLetterGrade(avgGradeValue);
    
    return {
      data,
      averageGrade: calculatedGrade
    };
  }, [gradeLetters, getGradeColor, getLetterGrade, gradeValues]);

  // Generate random section data
  const generateSectionData = useCallback(() => {
    // Create 3 sections with different distributions
    const section1 = {
      id: "1",
      name: "Section 001",
      professor: "Prof. Johnson",
      time: "MWF 9:30am - 10:20am",
      ...generateDistributionWithAverage('A-')
    };
    
    const section2 = {
      id: "2",
      name: "Section 002",
      professor: "Prof. Smith",
      time: "TR 1:30pm - 2:45pm",
      ...generateDistributionWithAverage('B+')
    };
    
    const section3 = {
      id: "3",
      name: "Section 003",
      professor: "Prof. Williams",
      time: "MWF 2:30pm - 3:20pm",
      ...generateDistributionWithAverage('B')
    };
    
    // Generate overall data (combined sections)
    const combinedData = [];
    const sections = [section1, section2, section3];
    
    // Initialize combined data with zeros
    gradeLetters.forEach((grade) => {
      combinedData.push({
        grade,
        students: 0,
        fill: getGradeColor(grade)
      });
    });
    
    // Sum up students for each grade across all sections
    sections.forEach(section => {
      section.data.forEach((item, index) => {
        combinedData[index].students += item.students;
      });
    });
    
    // Calculate combined average
    let totalPoints = 0;
    let totalStudents = 0;
    
    combinedData.forEach(item => {
      totalPoints += gradeValues[item.grade] * item.students;
      totalStudents += item.students;
    });
    
    const avgGradeValue = totalPoints / totalStudents;
    const calculatedGrade = getLetterGrade(avgGradeValue);
    
    // Add combined data as "All Sections"
    const allSections = {
      id: "all",
      name: "All Sections",
      data: combinedData,
      averageGrade: calculatedGrade
    };
    
    return [allSections, ...sections];
  }, [generateDistributionWithAverage, gradeLetters, getGradeColor, gradeValues, getLetterGrade]);

  // Handle section change
  const handleSectionChange = useCallback((sectionId) => {
    setSelectedSection(sectionId);
    
    // Find selected section
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setGradeData(section.data);
      setAverageGrade(section.averageGrade);
    }
  }, [sections]);

  useEffect(() => {
    if (!id) {
      setErrorMessage("Class ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchClassDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses/${id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Class not found");
        }
        const data = await response.json();
        setClassDetails(data);

        // Generate section data
        const sectionData = generateSectionData();
        setSections(sectionData);
        
        // Set default to "All Sections"
        setGradeData(sectionData[0].data);
        setAverageGrade(sectionData[0].averageGrade);

        // Fetch other classes taught by any of the professors (limit 3)
        if (data.professor) {
          const professorNames = data.professor
            .split(",")
            .map((name) => name.trim());
          let allFoundClasses = []; // Store ALL found classes here

          for (const professorName of professorNames) {
            console.log(`Fetching classes for professor: "${professorName}"`);

            try {
              const otherClassesResponse = await fetch(
                `${API_URL}/api/courses/professor/${encodeURIComponent(
                  professorName
                )}`,
                {
                  credentials: "include",
                }
              );

              if (otherClassesResponse.ok) {
                const otherClassesData = await otherClassesResponse.json();
                console.log(
                  `Found ${otherClassesData.length} classes for ${professorName}`
                );

                // Filter out the current class
                const newClasses = otherClassesData.filter(
                  (course) => course._id !== id
                );
                console.log(
                  `After filtering current class, found ${newClasses.length} other classes`
                );

                // Add to our collection of all found classes
                allFoundClasses = [...allFoundClasses, ...newClasses];
              } else {
                console.error(
                  `Error fetching classes for professor "${professorName}":`,
                  otherClassesResponse.statusText
                );
              }
            } catch (err) {
              console.error(
                `Exception while fetching classes for "${professorName}":`,
                err
              );
            }
          }

          // Remove duplicates (in case a course has multiple professors from our list)
          const uniqueClasses = allFoundClasses.filter(
            (course, index, self) =>
              index === self.findIndex((c) => c._id === course._id)
          );

          // Limit to 3 classes
          const limitedClasses = uniqueClasses.slice(0, 3);
          console.log(`Final display: ${limitedClasses.length} classes`);

          setOtherClasses(limitedClasses);
        }
      } catch (err) {
        console.error("❌ Error fetching class details:", err);
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [id, generateSectionData]);

  // Close professor options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        professorOptionsRef.current &&
        !professorOptionsRef.current.contains(event.target)
      ) {
        setProfessorOptions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRedditSearch = () => {
    const searchQuery = `${classDetails.courseCode} ${classDetails.title}`;
    const redditUrl = `https://www.reddit.com/r/Purdue/search?q=${encodeURIComponent(
      searchQuery
    )}&restrict_sr=1`;
    window.open(redditUrl, "_blank");
  };

  const handleRateMyProfessorSearch = () => {
    if (!classDetails?.professor) {
      alert("No professor listed for this class.");
      return;
    }

    const professorNames = classDetails.professor
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name && name.toLowerCase() !== "staff");

    // Hardcoded map of professor name to RMP ID
    const knownProfessors = {
      "Sarah H Sellke": "1734941",
      "Wojciech Szpankowski": "132647",
      // Add more here later if needed
    };

    if (professorNames.length === 1) {
      const name = professorNames[0];
      const encodedName = encodeURIComponent(name);

      const url = knownProfessors[name]
        ? `https://www.ratemyprofessors.com/professor/${knownProfessors[name]}`
        : `https://www.ratemyprofessors.com/search/professors/783?q=${encodedName}`;

      window.open(url, "_blank");
    } else {
      // Show options if more than one professor
      const options = professorNames.map((name, index) => {
        const encodedName = encodeURIComponent(name);
        const url = knownProfessors[name]
          ? `https://www.ratemyprofessors.com/professor/${knownProfessors[name]}`
          : `https://www.ratemyprofessors.com/search/professors/783?q=${encodedName}`;

        return (
          <button
            key={index}
            onClick={() => {
              window.open(url, "_blank");
              setProfessorOptions(null);
            }}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {name}
          </button>
        );
      });

      setProfessorOptions(options);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!classDetails || errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {errorMessage || "Class not found."}
      </div>
    );
  }

  // Calculate the maximum student count for scaling the bars
  const maxStudents = Math.max(...gradeData.map(item => item.students), 1);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-yellow-700">
          {classDetails.courseCode}: {classDetails.title}
        </h1>
        <p className="mt-2 text-gray-700">
          {classDetails.description || "No description available."}
        </p>
        <p className="mt-2">
          <strong>Professor:</strong> {classDetails.professor || "Unknown"}
        </p>
        <p className="mt-2">
          <strong>Credits:</strong> {classDetails.creditHours || "Unknown"}
        </p>
        <p className="mt-2">
          <strong>Type:</strong> {classDetails.type || "Unknown"}
        </p>

        {/* Grade Distribution Section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Grade Distribution
          </h2>
          
          {/* Section Selector */}
          <div className="mt-4 mb-6">
            <label htmlFor="sectionSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Select Section:
            </label>
            <select
              id="sectionSelect"
              value={selectedSection}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="block w-full max-w-md py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} {section.professor ? `- ${section.professor}` : ''} {section.time ? `(${section.time})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center my-4">
            <span className="font-semibold mr-2">Average Grade:</span>
            <span 
              className="text-lg font-bold" 
              style={{ color: getGradeColor(averageGrade) }}
            >
              {averageGrade}
            </span>
          </div>
          
          {/* Custom Bar Chart - Bottom Aligned w/ Absolute Height Values */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-end h-64" style={{ minHeight: '200px' }}>
              {gradeData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-end"
                  style={{ flex: '1 1 0', position: 'relative' }}
                >
                  <div 
                    style={{ 
                      height: `${(item.students / maxStudents) * 200}px`,
                      backgroundColor: item.fill,
                      width: '80%',
                      borderTopLeftRadius: '3px',
                      borderTopRightRadius: '3px',
                      minHeight: item.students > 0 ? '4px' : '0',
                      transition: 'height 0.3s ease'
                    }}
                  ></div>
                  <div className="mt-2 text-xs font-medium w-full text-center">{item.grade}</div>
                  <div className="text-xs text-gray-500 w-full text-center">{item.students}</div>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 italic">
            This chart shows the historical grade distribution for this course across {selectedSection === "all" ? "all sections" : "the selected section"}.
          </p>
        </div>

        {otherClasses.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Other classes taught by these professors:
            </h2>
            <ul className="list-disc list-inside mt-2">
              {otherClasses.map((course) => (
                <li
                  key={course._id}
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => navigate(`/class/${course._id}`)}
                >
                  {course.courseCode}: {course.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-gray-500">
            No other classes found for these professors.
          </p>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Back
        </button>

        <button
          onClick={handleRedditSearch}
          className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Find on Reddit
        </button>

        <button
          onClick={handleRateMyProfessorSearch}
          className="mt-4 ml-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          RateMyProfessor
        </button>

        {professorOptions && (
          <div ref={professorOptionsRef} className="mt-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Select a professor:
            </h2>
            <div className="flex flex-col mt-2">{professorOptions}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
