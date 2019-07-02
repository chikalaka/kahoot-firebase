import React, { useState, useEffect } from "react";
import "./App.css";
import firebase from "firebase";
import _ from "lodash";

const useRealtimeValue = query => {
  const [value, setValue] = useState();
  const [key, setKey] = useState();

  useEffect(() => {
    query &&
      query.on("value", snapshot => {
        const value = snapshot.val();
        const key = snapshot.key;
        setValue(value);
        setKey(key);
      });
  }, [query.toString()]);
  return key && value && { ...value, key };
};

const IS_ADMIN = true;

const userId = _.random(1, 4);

function App() {
  const [input, setInput] = useState("");

  const userRef = firebase.database().ref("users/" + userId);
  const quizRef = input && firebase.database().ref(input);

  const user = useRealtimeValue(userRef);
  const quiz = useRealtimeValue(quizRef);

  if (quiz) {
    quizRef
      .child("activeUsers")
      .child(user.key)
      .set(user);
  }


  if (!quiz)
    return <Welcome {...user} onInputChange={e => setInput(e.target.value)} />;

  const { showResults, questions, questionsCount, isWaiting } = quiz

  if (showResults) {
    const isEOG = questionsCount + 1 === questions.length;
    return <Results {...quiz} isEOG={isEOG} />;
  }
  if (isWaiting)
    return <Waiting />;

  const questionRef = quizRef.child("questions").child(questionsCount);
  return (
    <Question
      {...{
        questionRef,
        user,
        ...questions[questionsCount]
      }}
    />
  );
}

const Welcome = ({ name, onInputChange }) => {
  return (
    <div className="page">
      <div className="title">Hi {name}</div>
      <input onChange={onInputChange} placeholder="Game PIN" />
    </div>
  );
};

const Question = ({
  questionRef,
  title,
  body,
  answers = [],
  answered,
  user = {},
  onDone
}) => {
  const [selected, setSelected] = useState();
  const setAnswered = answer => {
    questionRef
      .child("answered")
      .child(user.key)
      .set({ ...user, answer });
    setSelected(answer);
  };

  const getAnswerClass = num =>
    `answer answer${num} ${selected === num && "selected"}`;

  return (
    <div className="page">
      <div className="title">{title}</div>
      <div className="question">{body}</div>
      <div className="answers">
        {answers.map((answer, i) => (
          <div
            key={i}
            className={getAnswerClass(i)}
            onClick={() => setAnswered(i)}
          >
            {answer}
          </div>
        ))}
      </div>
      <div className="answered">
        Answered: {answered ? Object.keys(answered).length : 0}
      </div>
    </div>
  );
};

const Results = ({ activeUsers = [], questions = [], onNext, isEOG }) => {
  const users = _.map(_.filter(activeUsers, v => v), (user = {}) => {
    const scores = _.map(questions, ({ answered, rightAnswer }) => {
      if (_.get(answered, [user.key, "answer"]) === rightAnswer) {
        return 1000;
      }
      return 0;
    });
    const sum = scores.reduce((acc, val) => acc + val, 0);
    return { ...user, score: sum };
  });
  const topUsers = _.sortBy(users, "score")
    .reverse()
    .slice(0, 10);

  const [first, second, third] = topUsers;

  if (isEOG) {
    return <Winners {...{ first, second, third }} />;
  }

  return (
    <div className="page">
      <div className="title">Top 10:</div>
      {topUsers.map((user = {}) => (
        <div key={user.key}>
          {user.name}: {user.score}
        </div>
      ))}
    </div>
  );
};

const Winners = ({ first = {}, second = {}, third = {} }) => (
  <div className="page">
    <div className="title">The Winners</div>
    <div className="winners">
      <div className="winner">
        <div>{second.name}</div>
        <div className="second-winner">{second.score}</div>
      </div>
      <div className="winner">
        <div>{first.name}</div>
        <div className="first-winner">{first.score}</div>
      </div>
      <div className="winner">
        <div>{third.name}</div>
        <div className="third-winner">{third.score}</div>
      </div>
    </div>
  </div>
);

const Waiting = () => {
  return (
    <div className="page">
      <div>Waiting for other players</div>
    </div>
  );
};

export default App;
