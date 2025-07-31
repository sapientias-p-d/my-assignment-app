import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { FaCheckCircle } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

// 교과 리스트
const SUBJECTS = [
  "국어", "수학", "사회", "과학", "영어", "미술", "체육", "음악", "도덕",
  "주제글쓰기", "동아리", "창체", "기타"
];

// 제목 자르기 함수
const truncate = (text, n = 10) =>
  text.length > n ? text.slice(0, n) + "..." : text;

function App() {
  const [assignments, setAssignments] = useState([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 과제 목록 실시간 가져오기
  useEffect(() => {
    const q = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setAssignments(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  // 과제 추가 핸들러
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      await addDoc(collection(db, "assignments"), {
        subject,
        title,
        desc,
        dueDate,
        createdAt: Timestamp.now(),
        status: "pending",
      });
      setTitle("");
      setDesc("");
      setDueDate("");
      setSubject(SUBJECTS[0]);
      setShowModal(false);
    } catch (error) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  // 과제 상태 변경 (제출/완료)
  const handleStatus = async (id, status) => {
    await updateDoc(doc(db, "assignments", id), { status });
  };

  // 모달 닫기
  const closeModal = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow py-4 px-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">과제 관리 시스템</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-blue-700 transition"
        >
          새 과제 등록
        </button>
      </header>

      {/* 과제 등록 모달 */}
      {showModal && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow relative">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-red-400"
            >
              <IoMdClose />
            </button>
            <h2 className="text-xl font-bold mb-6">새 과제 등록</h2>
            <form onSubmit={handleAddAssignment}>
              <div className="mb-4">
                <label className="block font-semibold mb-1">교과</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                >
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">과제 제목</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  maxLength={40}
                  placeholder="과제 제목"
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">제출일</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">과제 설명</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="과제 설명"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xl"
              >
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 과제 목록 */}
      <main className="max-w-2xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-5">과제 목록</h2>
        {assignments.length === 0 ? (
          <div className="text-center text-gray-400 py-10">등록된 과제가 없습니다.</div>
        ) : (
          <ul className="space-y-5">
            {assignments.map((as) => (
              <li
                key={as.id}
                className="bg-white rounded-xl shadow p-6 flex flex-col"
              >
                {/* 1행: 교과 */}
                <div className="text-blue-700 font-bold text-sm mb-1">{as.subject}</div>
                {/* 2행: 과제 제목 (툴팁/중략) */}
                <div
                  className="font-semibold text-lg mb-2 truncate"
                  title={as.title}
                >
                  {truncate(as.title)}
                </div>
                <div className="text-gray-400 text-xs mb-2">{as.dueDate}</div>
                <div className="text-gray-700 text-sm mb-3">{as.desc}</div>

                {/* 제출/완료 버튼 */}
                <div className="flex justify-center mt-1 gap-3">
                  <button
                    className="relative flex items-start justify-center w-24 h-10 rounded-xl border-2 border-blue-500 text-blue-600 font-bold"
                    onClick={() => handleStatus(as.id, "submitted")}
                  >
                    <span className="absolute top-1 left-1/2 -translate-x-1/2">제출하기</span>
                  </button>
                  <button
                    className="relative flex items-start justify-center w-24 h-10 rounded-xl border-2 border-green-500 text-green-600 font-bold"
                    onClick={() => handleStatus(as.id, "completed")}
                  >
                    <span className="absolute top-1 left-1/2 -translate-x-1/2">완료</span>
                  </button>
                </div>
                {/* 상태 표시 */}
                {as.status === "completed" && (
                  <div className="flex items-center text-green-600 mt-2 font-bold">
                    <FaCheckCircle className="mr-1" /> 과제 완료
                  </div>
                )}
                {as.status === "submitted" && as.status !== "completed" && (
                  <div className="flex items-center text-blue-500 mt-2 font-bold">
                    <FaCheckCircle className="mr-1" /> 제출됨
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
