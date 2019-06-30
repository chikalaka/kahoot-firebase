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

  if (!quiz)
    return <Welcome {...user} onInputChange={e => setInput(e.target.value)} />;

  quizRef
    .child("activeUsers")
    .child(user.key)
    .set(user);

  if (quiz.showResults) {
    const onNext = () => {
      quizRef.child("showResults").set(false);
      quizRef.child("questionsCount").set(quiz.questionsCount + 1);
    };
    const isEOG = quiz.questionsCount + 1 === quiz.questions.length;
    return <Results {...quiz} onNext={onNext} isEOG={isEOG} />;
  }
  if (quiz.isWaiting)
    return <Waiting onBegin={() => quizRef.child("isWaiting").set(false)} />;

  const questionRef = quizRef.child("questions").child(quiz.questionsCount);
  const onDone = () => {
    quizRef.child("showResults").set(true);
  };
  return (
    <Question
      {...{
        onDone,
        questionRef,
        user,
        ...quiz.questions[quiz.questionsCount]
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
      {IS_ADMIN && (
        <div className="admin-button done" onClick={onDone}>
          Done
        </div>
      )}
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
  console.log(activeUsers);
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

  const [first = {}, second = {}, third = {}] = topUsers;

  if (isEOG) {
    return (
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
  }

  return (
    <div className="page">
      <div className="title">Top 10:</div>
      {topUsers.map((user = {}) => (
        <div key={user.key}>
          {user.name}: {user.score}
        </div>
      ))}
      {IS_ADMIN && (
        <div className="admin-button" onClick={onNext}>
          Next
        </div>
      )}
    </div>
  );
};

const Waiting = ({ onBegin }) => {
  return (
    <div className="page">
      <div>Waiting for other players</div>
      {IS_ADMIN && (
        <div className="admin-button" onClick={onBegin}>
          Let's Begin
        </div>
      )}
    </div>
  );
};

export default App;
