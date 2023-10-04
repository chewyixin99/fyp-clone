import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="w-[80vw] mx-auto my-6">
      <div className="p-3">
        <h2 className="my-3">IS483 Project Experience</h2>
        <h4 className="my-3 italic">Team 23, Bus Lightyear</h4>
      </div>
      {/* Introduction */}
      <div className="p-3 text-center">
        <h6>
          This project is part of SMU's Final Year Project (IS483), done by the
          following students:
        </h6>
        <div className="flex items-center my-5 justify-center">
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/GanJL"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/jianlin.png"
            />
            <div className="text-center">Gan Jian Lin</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/hellobiondi"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/biondi.png"
            />
            <div className="text-center">Biondi Lee</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/chewyixin99"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/yixin.png"
            />
            <div className="text-center">Chew Yi Xin</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/cal1st4r"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/calista.png"
            />
            <div className="text-center">Calista Lim</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/lohkokwee"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/kokwee.png"
            />
            <div className="text-center">Loh Kok Wee</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://github.com/gadddy"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/gadman.png"
            />
            <div className="text-center">Gadman Tang</div>
          </Link>
        </div>
        <h4>
          For the following sponsors of{" "}
          <Link
            className="italic underline hover:text-gray-500"
            to="https://www.linkedin.com/company/paymentinapp/"
            rel="noopener noreferrer"
            target="_blank"
          >
            PaymentInApp Inc.
          </Link>
        </h4>
        <div className="flex items-baseline my-5 justify-center">
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to="https://www.linkedin.com/in/paymentinapp/"
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/jonathan.png"
            />
            <div className="text-center">Jonathan Suh</div>
            <div className="text-center">CEO</div>
          </Link>
          <Link
            className="mx-3"
            target="_blank"
            rel="noopener noreferrer"
            to=""
          >
            <img
              width="150px"
              height="150px"
              src="src/assets/landing/alex.png"
            />
            <div className="text-center">Alex Park</div>
            <div className="text-center">Project Manager</div>
          </Link>
        </div>
      </div>
      <div className="flex justify-evenly my-3">
        {/* Background */}
        <div className="border-l-2 p-3 my-3">
          <h4>Project background and motivation</h4>
          <p className="m-3">
            PIAPP is a{" "}
            <span className="highlight-text">
              Mobility-as-a-Service (MaaS) provider
            </span>
            , aiming to solve social problems like{" "}
            <span className="highlight-text">
              traffic congestion and environmental issues
            </span>
            . Currently, they are looking to enhance its MaaS offerings by
            <span className="highlight-text">
              improving their behind-the-scene algorithms
            </span>{" "}
            by partnering with SMU.
          </p>
          <p className="m-3">
            Public transportation is one of the{" "}
            <span className="highlight-text">most widely used</span> form of
            transportation. However, the bus transportation network at the
            current stage is{" "}
            <span className="highlight-text">not efficient</span> enough,
            resulting in <span className="highlight-text">bus bunching</span>,
            <span className="highlight-text">overcrowded buses</span>, and{" "}
            <span className="highlight-text">late arrivals</span>.
          </p>
        </div>
        {/* Objective */}
        <div className="border-l-2 p-3 my-3">
          <h4>Objective</h4>
          <p className="m-3">
            The team's objective is to optimise bus dispatch through demand
            analysis and forecasting. Our main goal is to reduce{" "}
            <span className="highlight-text font-bold">headway</span>, which is
            the{" "}
            <span className="highlight-text">
              time inteval between consecutive buses on the same route or line
            </span>
            . In other words, it is the{" "}
            <span className="highlight-text">
              duration of time passengers have to wait at a bus stop or station
              for the next bus to arrive
            </span>
            .
          </p>
          <p className="m-3">
            We can measure this by calculating the{" "}
            <span className="highlight-text font-bold">
              Weighted Headway Deviation
            </span>
            , represented by the following formula.
          </p>
          <div className="flex justify-center">
            <img src="src/assets/landing/WHD.png" />
          </div>
          <p className="m-3">
            The team hopes that our{" "}
            <span className="highlight-text">research-backed</span> model can be
            a <span className="highlight-text">universal</span> solution that
            enables PIAPP's adoption of this solution{" "}
            <span className="highlight-text">at scale</span>.
          </p>
        </div>
      </div>
      {/* Methodology */}
      <div className="border-l-2 p-3 my-3">
        <h4>Methodology</h4>
        <div className="flex justify-between">
          <div>
            <p className="m-3">
              The team embarked on this project using industry-standard Scrum
              and Agile methodologies, modifying it slightly to suit the dynamic
              schedules of the team members, who are all busy with their
              separate modules.
            </p>
            <p className="m-3">
              Alongside that, we made use of the following tools to help with
              our project management
              <span className="list-item">
                JIRA for backlog and timeline management
              </span>
              <span className="list-item">
                Confluence to keep track and manage a central repository of
                internal documentation and research.
              </span>
              <span className="list-item">
                Github for versioning and maintenance of our code repositories
              </span>
              <span className="list-item">Postman to build and test APIs</span>
            </p>
          </div>
          <img className="w-[50%] h-[40%]" src="src/assets/landing/scrum.png" />
        </div>
      </div>
      {/* Technical design */}
      <div className="border-l-2 p-3 my-3">
        <h4>Technical design</h4>
        <p className="m-3">Here is a brief overview of our technical design.</p>
        <div className="flex justify-center">
          <img src="src/assets/landing/technical-design-oct.png" />
        </div>
        <h6>TriMet</h6>
        <p className="m-3">
          TriMet is our main source of data, providing us with GTFS Realtime
          feed which is one of our project requirements.
        </p>
        <h6>Backend server</h6>
        <p className="m-3">
          Our backend server uses Pippen and Gorm allowing us to poll data from
          TriMet.
        </p>
        <h6>Star Command</h6>
        <p className="m-3">
          Star Command is also part of our backend, and it is mainly used as the
          main interface for the UI to call and interact with the backend
          server. The job of Star Command is mainly to
          <span className="list-item">
            Execute ETL scripts which transform raw data collected from Pippen
          </span>
          <span className="list-item">
            Allows mathematical model to take in scripted inputs, and compute
            bus dispatch times
          </span>
          <span className="list-item">
            OpenAPI conformant APIs produce self-documenting code
          </span>
          <span className="list-item">
            Support for concurrency prevents potential bottlenecking from model
            computation
          </span>
        </p>
        <h6>Frontend</h6>
        <p className="m-3">
          The frontend is where we are able to display the results of the model
          and visualise it for the user to see.
        </p>
      </div>
      <div className="text-gray-500 flex justify-center mt-10">
        Last updated October 23
      </div>
    </div>
  );
};

export default LandingPage;
