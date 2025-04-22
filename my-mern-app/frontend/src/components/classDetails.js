import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = "http://localhost:5001";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = React.useState(null);
  const [otherClasses, setOtherClasses] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [professorOptions, setProfessorOptions] = React.useState(null);
  const professorOptionsRef = React.useRef(null);

  const [gradeData, setGradeData] = React.useState([]);
  const [avgGPA, setAvgGPA] = React.useState(null);

  React.useEffect(() => {
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

        // Hardcoded grade data
        const hardcodedData = [
          {
            section: "001",
            instructor: "Dr. Testerson",
            avgGrade: "2.85",
            grades: {
              A: 12, "A-": 9, "A+": 4, B: 21, "B-": 18, "B+": 8,
              C: 10, "C-": 2, "C+": 3, D: 1, F: 0,
            },
          },
          {
            section: "002",
            instructor: "Prof. Example",
            avgGrade: "3.12",
            grades: {
              A: 20, "A-": 11, "A+": 6, B: 19, "B-": 15, "B+": 10,
              C: 4, "C-": 2, "C+": 1, D: 0, F: 0,
            },
          },
        ];

        setGradeData(hardcodedData);
        const gpas = hardcodedData.map((d) => parseFloat(d.avgGrade));
        const avg = gpas.reduce((a, b) => a + b, 0) / gpas.length;
        setAvgGPA(avg.toFixed(2));

        // Other classes by professor
        if (data.professor) {
          const professorNames = data.professor
            .split(",")
            .map((name) => name.trim());
          let allFoundClasses = [];

          for (const professorName of professorNames) {
            try {
              const otherClassesResponse = await fetch(
                `${API_URL}/api/courses/professor/${encodeURIComponent(
                  professorName
                )}`,
                { credentials: "include" }
              );

              if (otherClassesResponse.ok) {
                const otherClassesData = await otherClassesResponse.json();
                const newClasses = otherClassesData.filter(
                  (course) => course._id !== id
                );
                allFoundClasses = [...allFoundClasses, ...newClasses];
              }
            } catch (err) {
              console.error(`Error fetching classes for "${professorName}":`, err);
            }
          }

          const uniqueClasses = allFoundClasses.filter(
            (course, index, self) =>
              index === self.findIndex((c) => c._id === course._id)
          );
          const limitedClasses = uniqueClasses.slice(0, 3);
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
  }, [id]);

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

    const knownProfessors = {
      "Sarah H Sellke": "1734941",
      "Wojciech Szpankowski": "132647",
    };

    if (professorNames.length === 1) {
      const name = professorNames[0];
      const encodedName = encodeURIComponent(name);
      const url = knownProfessors[name]
        ? `https://www.ratemyprofessors.com/professor/${knownProfessors[name]}`
        : `https://www.ratemyprofessors.com/search/professors/783?q=${encodedName}`;
      window.open(url, "_blank");
    } else {
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

  React.useEffect(() => {
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate(-1)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Back
          </button>
          <button
            onClick={handleRedditSearch}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Find on Reddit
          </button>
          <button
            onClick={handleRateMyProfessorSearch}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            RateMyProfessor
          </button>
        </div>

        {professorOptions && (
          <div ref={professorOptionsRef} className="mt-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Select a professor:
            </h2>
            <div className="flex flex-col mt-2">{professorOptions}</div>
          </div>
        )}
      </div>

      {gradeData.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-yellow-700 mb-2">Grade Distributions</h2>

          {avgGPA && (
            <p className="mb-4 text-gray-700">
              <strong>Average GPA across sections:</strong> {avgGPA}
            </p>
          )}

          {gradeData.map((section, idx) => {
            const chartData = Object.entries(section.grades)
              .filter(([_, count]) => count > 0)
              .map(([grade, count]) => ({ grade, count }));

            return (
              <div key={idx} className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  Section {section.section} — {section.instructor}
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassDetails;
