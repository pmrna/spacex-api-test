import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import "./assets/scss/styles.scss";
import Spinner from "./components/Spinner/Spinner";

const ITEMS_PER_PAGE = 10;

const App = () => {
  const [launches, setLaunches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState(null);

  const fetchLaunches = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.spacexdata.com/v3/launches?limit=${ITEMS_PER_PAGE}&offset=${offset}`
      );
      const data = await response.json();

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setLaunches((prevLaunches) => [...prevLaunches, ...data]);
      setOffset((prevOffset) => prevOffset + ITEMS_PER_PAGE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunches();
  }, []);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      fetchLaunches();
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredLaunches = launches.filter((launch) =>
    launch.mission_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="App">
      <h1>SpaceX Launches</h1>
      <input
        type="search"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search..."
        className="search"
      />
      <div className="launch">
        <div className="launch__list">
          {filteredLaunches.map((launch, index) => (
            <div key={index} className="launch__item">
              <h2>{launch.mission_name}</h2>
              <div>
                {/* we determine if the launch is successful if the launch_success is true, otherwise, we check if the launch is upcoming, otherwise, it's a failed launch. */}
                <p
                  className={`launch__status ${
                    launch.launch_success
                      ? "launch__status--success"
                      : launch.upcoming
                      ? "launch__status--warning"
                      : "launch__status--danger"
                  }`}
                >
                  {launch.launch_success
                    ? "Success"
                    : launch.upcoming
                    ? "Upcoming"
                    : "Failed"}
                </p>
              </div>
              {view === launch.flight_number && (
                <div>
                  <div className="launch__meta">
                    <span>
                      {new Date().getFullYear() - launch.launch_year} years ago
                    </span>
                    <span> | </span>
                    <a href={launch.links.article_link}>Article</a>
                    <span> | </span>
                    <a href={launch.links.video_link}>Video</a>
                  </div>
                  <div className="launch__body">
                    <img
                      src={launch.links.mission_patch_small}
                      alt={launch.mission_name}
                      className="media"
                    />
                    <p className="launch__details">{launch.details}</p>
                  </div>
                </div>
              )}
              <button
                className="btn btn--primary"
                onClick={() =>
                  setView(
                    view === launch.flight_number ? null : launch.flight_number
                  )
                }
              >
                {view === launch.flight_number ? "Hide" : "View"}
              </button>
            </div>
          ))}

          {isLoading && <Spinner />}

          {!hasMore && !isLoading && (
            <div className="max-reached">End of list.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
