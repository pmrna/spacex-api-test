import React, { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import "./assets/scss/styles.scss";
import Spinner from "./components/Spinner/Spinner";

const ITEMS_PER_PAGE = 2;

const App = () => {
  const [launches, setLaunches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState(null);
  const observer = useRef();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLaunches = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.spacexdata.com/v3/launches?limit=${ITEMS_PER_PAGE}&offset=${offset}&mission_name=${debouncedQuery}`
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
  }, [offset, hasMore, isLoading, debouncedQuery]);

  useEffect(() => {
    setLaunches([]);
    setOffset(0);
    setHasMore(true);
  }, [debouncedQuery]);

  useEffect(() => {
    fetchLaunches();
  }, [fetchLaunches]);

  const lastLaunchRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && hasMore) fetchLaunches();
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchLaunches]
  );

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredLaunches = launches.filter((launch) =>
    launch.mission_name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div className="container">
      <h1 className="heading">SpaceX Launches</h1>
      <input
        type="search"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search..."
        className="search"
      />

      <div className="launch__wrapper fade-enter-active">
        <div className="launch__list">
          {filteredLaunches.length > 0
            ? filteredLaunches.map((launch, index) => {
                const isLastItem = index === filteredLaunches.length - 1;
                return (
                  <div
                    key={launch.flight_number}
                    className="launch__item"
                    ref={isLastItem ? lastLaunchRef : null}
                  >
                    <h2>{launch.mission_name}</h2>
                    <div>
                      <p
                        className={`launch__status ${
                          launch.launch_success
                            ? "launch__status--success"
                            : launch.upcoming
                            ? "launch__status--info"
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
                      <div className="launch__details">
                        <div className="launch__meta">
                          <span>
                            {new Date().getFullYear() - launch.launch_year}{" "}
                            years ago
                          </span>
                          <span> | </span>
                          <a href={launch.links.article_link} className="link">
                            Article
                          </a>
                          <span> | </span>
                          <a href={launch.links.video_link} className="link">
                            Video
                          </a>
                        </div>
                        <div className="media">
                          <img
                            src={launch.links.mission_patch_small}
                            alt={launch.mission_name}
                            className="launch__image"
                            loading="lazy"
                          />
                          <p>{launch.details}</p>
                        </div>
                      </div>
                    )}
                    <button
                      className="btn btn--primary"
                      onClick={() =>
                        setView(
                          view === launch.flight_number
                            ? null
                            : launch.flight_number
                        )
                      }
                    >
                      {view === launch.flight_number ? "Hide" : "View"}
                    </button>
                  </div>
                );
              })
            : !isLoading && <p>No results found.</p>}
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
