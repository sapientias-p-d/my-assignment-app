import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    doc, 
    deleteDoc, 
    updateDoc,
    query,
    writeBatch,
    where,
    getDocs
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

// --- Firebase 설정 ---
// 이 곳에 본인의 Firebase 프로젝트 설정 코드를 붙여넣어 주세요.
const firebaseConfig = {
  apiKey: "AIzaSyClvFkfRyG3daXrZP1C-a7w9Jhm9OwNV54",
  authDomain: "assignment-management-6bcc9.firebaseapp.com",
  projectId: "assignment-management-6bcc9",
  storageBucket: "assignment-management-6bcc9.firebasestorage.app",
  messagingSenderId: "647736009966",
  appId: "1:647736009966:web:6e6220b9eeb58243477fff"
};

// Firebase 앱 및 서비스 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- 아이콘 컴포넌트 (SVG) ---
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect width="22" height="5" x="1" y="3" rx="1"/><path d="M10 12h4"/></svg>;


// --- 메인 앱 컴포넌트 ---
export default function App() {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    
    const [selectedClassId, setSelectedClassId] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null });

    // Firestore 데이터 실시간 구독
    useEffect(() => {
        setLoading(true);
        const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubAssignments = onSnapshot(collection(db, "assignments"), (snapshot) => {
            setAllAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubSubmissions = onSnapshot(collection(db, "submissions"), (snapshot) => {
            setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubClasses();
            unsubStudents();
            unsubAssignments();
            unsubSubmissions();
        };
    }, []);

    // 학급 선택에 따른 데이터 필터링
    const currentStudents = students.filter(s => s.classId === selectedClassId);
    const currentAssignments = allAssignments.filter(a => a.classId === selectedClassId && !a.isArchived);
    
    // Helper 함수
    const getUnsubmittedCount = (studentId) => {
        return currentAssignments.length - submissions.filter(s => s.studentId === studentId && currentAssignments.some(a => a.id === s.assignmentId) && s.submitted).length;
    };

    const isSubmitted = (studentId, assignmentId) => {
        return submissions.some(s => s.studentId === studentId && s.assignmentId === assignmentId && s.submitted);
    };

    // 통계 데이터
    const totalStudents = currentStudents.length;
    const totalSubmissions = submissions.filter(s => currentStudents.some(st => st.id === s.studentId) && currentAssignments.some(a => a.id === s.assignmentId) && s.submitted).length;
    const totalPossibleSubmissions = totalStudents * currentAssignments.length;
    const notSubmittedCount = totalPossibleSubmissions - totalSubmissions;

    // 학생 목록 필터링
    const filteredStudents = currentStudents.filter(student => {
        if (filter === 'all') return true;
        const unsubmittedCount = getUnsubmittedCount(student.id);
        if (filter === 'submitted') return currentAssignments.length > 0 && unsubmittedCount === 0;
        if (filter === 'not-submitted') return unsubmittedCount > 0;
        return true;
    });

    // --- Firestore 데이터 핸들러 ---
    const handleAddClass = async (className) => await addDoc(collection(db, "classes"), { name: className });
    const handleDeleteClass = async (classId) => await deleteDoc(doc(db, "classes", classId)); // Note: In a real app, you'd handle students/assignments in the class.
    
    const handleAddStudent = async (studentData) => await addDoc(collection(db, "students"), { ...studentData, classId: selectedClassId });
    const handleUpdateStudent = async (studentData) => { const { id, ...data } = studentData; await updateDoc(doc(db, "students", id), data); };
    const handleDeleteStudent = async (studentId) => {
        await deleteDoc(doc(db, "students", studentId));
        const batch = writeBatch(db);
        submissions.filter(s => s.studentId === studentId).forEach(sub => batch.delete(doc(db, "submissions", sub.id)));
        await batch.commit();
    };

    const handleAddAssignment = async (assignmentData) => await addDoc(collection(db, "assignments"), { ...assignmentData, classId: selectedClassId, isArchived: false });
    const handleArchiveAssignment = async (assignmentId) => await updateDoc(doc(db, "assignments", assignmentId), { isArchived: true });

    const handleToggleSubmission = async (studentId, assignmentId) => {
        const submission = submissions.find(s => s.studentId === studentId && s.assignmentId === assignmentId);
        if (submission) {
            await updateDoc(doc(db, "submissions", submission.id), { submitted: !submission.submitted });
        } else {
            await addDoc(collection(db, "submissions"), { studentId, assignmentId, submitted: true });
        }
    };

    const handleExportData = async () => {
        const classAssignments = allAssignments.filter(a => a.classId === selectedClassId);
        const classStudents = students.filter(s => s.classId === selectedClassId);
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // \uFEFF for BOM to handle Korean in Excel
        csvContent += "과제 날짜,교과,과제 제목,학생 이름,제출 여부\r\n";

        classAssignments.forEach(assignment => {
            classStudents.forEach(student => {
                const submitted = isSubmitted(student.id, assignment.id) ? 'O' : 'X';
                const row = [
                    assignment.dueDate || '미지정',
                    `"${assignment.subject}"`,
                    `"${assignment.title}"`,
                    `"${student.name}"`,
                    submitted
                ].join(',');
                csvContent += row + "\r\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const className = classes.find(c => c.id === selectedClassId)?.name || 'export';
        link.setAttribute("download", `${className}_과제_기록.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Header onMenuClick={(type) => setModal({ type, data: null })} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">과제 현황</h2>
                    <ClassSelector classes={classes} selectedClassId={selectedClassId} onClassChange={setSelectedClassId} />
                </div>

                {loading ? (
                    <div className="text-center py-16"><p className="text-gray-500 text-lg">데이터를 불러오는 중입니다...</p></div>
                ) : selectedClassId ? (
                    <>
                        <Dashboard totalStudents={totalStudents} submittedCount={totalSubmissions} notSubmittedCount={notSubmittedCount} />
                        <section className="mt-12">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="text-2xl font-bold text-gray-800">학생 목록</h3>
                                <FilterControls currentFilter={filter} onFilterChange={setFilter} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredStudents.map(student => (
                                    <StudentCard 
                                        key={student.id}
                                        student={student}
                                        assignments={currentAssignments}
                                        unsubmittedCount={getUnsubmittedCount(student.id)}
                                        isSubmitted={isSubmitted}
                                        onToggleSubmission={handleToggleSubmission}
                                        onDetailClick={() => setModal({ type: 'studentDetail', data: student })}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-md">
                        <h3 className="text-2xl font-semibold text-gray-700">학급을 선택해주세요</h3>
                        <p className="text-gray-500 mt-2">상단의 드롭다운 메뉴에서 관리할 학급을 선택하세요.</p>
                    </div>
                )}
            </main>
            <ModalManager
                modal={modal}
                closeModal={() => setModal({ type: null, data: null })}
                students={currentStudents}
                assignments={currentAssignments}
                submissions={submissions}
                classes={classes}
                selectedClassId={selectedClassId}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddAssignment={handleAddAssignment}
                onArchiveAssignment={handleArchiveAssignment}
                onAddClass={handleAddClass}
                onDeleteClass={handleDeleteClass}
                onExportData={handleExportData}
            />
        </div>
    );
}

// --- 하위 컴포넌트들 ---

const Header = ({ onMenuClick }) => (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold flex items-center justify-center md:justify-start gap-3"><BookIcon /> 과제 관리 시스템</h1>
                    <p className="text-indigo-200 mt-1 text-base">학생과 교사를 위한 스마트 과제 관리</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => onMenuClick('classManage')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base">학급 관리</button>
                    <button onClick={() => onMenuClick('assignmentManage')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base">과제 관리</button>
                    <button onClick={() => onMenuClick('studentManage')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base">학생 관리</button>
                </div>
            </div>
        </div>
    </header>
);

const ClassSelector = ({ classes, selectedClassId, onClassChange }) => (
    <select 
        value={selectedClassId} 
        onChange={(e) => onClassChange(e.target.value)}
        className="form-select block w-full md:w-64 px-4 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded-lg transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
    >
        <option value="">-- 학급 선택 --</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
);

const Dashboard = ({ totalStudents, submittedCount, notSubmittedCount }) => (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<UsersIcon />} title="총 학생 수" value={totalStudents} color="blue" />
        <StatCard icon={<CheckCircleIcon />} title="제출 완료" value={submittedCount} color="green" />
        <StatCard icon={<ClockIcon />} title="미제출" value={notSubmittedCount} color="red" />
    </section>
);

const StatCard = ({ icon, title, value, color }) => {
    const colors = { blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-500' };
    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 flex items-center gap-5">
            <div className={`p-3 rounded-full bg-gray-100 ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-base text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

const FilterControls = ({ currentFilter, onFilterChange }) => {
    const filters = [{ key: 'all', label: '전체' }, { key: 'submitted', label: '제출완료' }, { key: 'not-submitted', label: '미제출' }];
    return (
        <div className="flex gap-2 bg-gray-200 rounded-lg p-1.5">
            {filters.map(f => (
                <button key={f.key} onClick={() => onFilterChange(f.key)} className={`px-5 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${currentFilter === f.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-300'}`}>{f.label}</button>
            ))}
        </div>
    );
};

const StudentCard = ({ student, assignments, unsubmittedCount, isSubmitted, onToggleSubmission, onDetailClick }) => {
    const truncateText = (text, maxLength) => text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    return (
        <div className="bg-white rounded-xl p-5 card-shadow border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="text-center">
                <img src={student.photo || `https://placehold.co/150x150/E2E8F0/A0AEC0?text=${student.name[0]}`} alt={student.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-gray-100" onError={(e) => { e.target.src = `https://placehold.co/150x150/E2E8F0/A0AEC0?text=${student.name[0]}` }}/>
                <h3 className="text-xl font-semibold text-gray-800">{student.name}</h3>
                {assignments.length > 0 && (<div className={`text-sm font-medium px-3 py-1 rounded-full inline-block mt-1 mb-4 ${unsubmittedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{unsubmittedCount > 0 ? `미제출 ${unsubmittedCount}개` : '모든 과제 완료'}</div>)}
            </div>
            <div className="space-y-2 mb-4 flex-grow h-40 overflow-y-auto p-1">
                {assignments.length > 0 ? assignments.map(assignment => (
                    <button key={assignment.id} onClick={() => onToggleSubmission(student.id, assignment.id)} className={`w-full text-left text-white px-4 py-3 rounded-lg transition-transform duration-200 hover:scale-105 ${isSubmitted(student.id, assignment.id) ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs font-semibold opacity-80">{assignment.subject}</div>
                                <div className="font-semibold text-base">{truncateText(assignment.title, 10)}</div>
                            </div>
                            <span className="text-sm pt-1">{isSubmitted(student.id, assignment.id) ? '✓ 완료' : '제출하기'}</span>
                        </div>
                    </button>
                )) : <p className="text-gray-400 text-sm text-center pt-12">등록된 과제 없음</p>}
            </div>
            <button onClick={onDetailClick} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-base">상세보기</button>
        </div>
    );
};

const ModalManager = ({ modal, closeModal, ...props }) => {
    if (!modal.type) return null;
    if (!props.selectedClassId && ['studentManage', 'assignmentManage'].includes(modal.type)) {
        alert("먼저 학급을 선택해주세요.");
        return null;
    }
    const ModalComponent = { classManage: ClassManageModal, studentManage: StudentManageModal, assignmentManage: AssignmentManageModal, studentDetail: StudentDetailModal }[modal.type];
    return <ModalComponent closeModal={closeModal} data={modal.data} {...props} />;
};

const Modal = ({ children, title, closeModal }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b"><h3 className="text-xl font-bold text-gray-800">{title}</h3><button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button></div>
            <div className="p-6 overflow-y-auto">{children}</div>
        </div>
    </div>
);

const ClassManageModal = ({ closeModal, classes, onAddClass, onDeleteClass }) => {
    const [className, setClassName] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); onAddClass(className); setClassName(''); };
    return (
        <Modal title="학급 관리" closeModal={closeModal}>
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 flex gap-2">
                <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="새 학급 이름 (예: 1학년 1반)" className="flex-grow px-3 py-2 border rounded-lg" required />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium">추가</button>
            </form>
            <div className="space-y-3">
                {classes.map(c => (
                    <div key={c.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                        <span className="font-medium">{c.name}</span>
                        <button onClick={() => onDeleteClass(c.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><TrashIcon /></button>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

const StudentManageModal = ({ closeModal, students, onAddStudent, onUpdateStudent, onDeleteStudent, classes, selectedClassId }) => {
    const [form, setForm] = useState({ id: null, name: '', photo: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const currentClassName = classes.find(c => c.id === selectedClassId)?.name;

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const storageRef = ref(storage, `student_photos/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        let photoUrl = form.photo;
        if (imageFile) photoUrl = await uploadImage(imageFile);
        
        if (isEditing) {
            onUpdateStudent({ ...form, photo: photoUrl });
        } else {
            onAddStudent({ name: form.name, photo: photoUrl });
        }
        setIsUploading(false);
        resetForm();
    };

    const startEdit = (student) => { setIsEditing(true); setForm(student); setImagePreview(student.photo); setImageFile(null); };
    const resetForm = () => { setIsEditing(false); setForm({ id: null, name: '', photo: '' }); setImageFile(null); setImagePreview(''); if(fileInputRef.current) fileInputRef.current.value = ""; };

    return (
        <Modal title={`학생 관리: ${currentClassName}`} closeModal={closeModal}>
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                <h4 className="font-semibold text-gray-800">{isEditing ? "학생 정보 수정" : "새 학생 추가"}</h4>
                <div className="flex items-center gap-4">
                    <img src={imagePreview || `https://placehold.co/100x100/E2E8F0/A0AEC0?text=사진`} className="w-24 h-24 rounded-full object-cover bg-gray-200" alt="학생 사진 미리보기"/>
                    <div className="flex-grow">
                        <input name="name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="학생 이름" className="w-full px-3 py-2 border rounded-lg mb-2" required />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" ref={fileInputRef} />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"><CameraIcon /> 사진 선택</button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-blue-300">{isUploading ? "저장 중..." : (isEditing ? "수정 완료" : "학생 추가")}</button>
                    {isEditing && <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">취소</button>}
                </div>
            </form>
            <div className="space-y-3">
                {students.map(student => (
                    <div key={student.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3"><img src={student.photo || `https://placehold.co/40x40/E2E8F0/A0AEC0?text=${student.name[0]}`} className="w-10 h-10 rounded-full object-cover" alt={`${student.name} 학생 사진`}/><span className="font-medium">{student.name}</span></div>
                        <div className="flex gap-2"><button onClick={() => startEdit(student)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><EditIcon /></button><button onClick={() => onDeleteStudent(student.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><TrashIcon /></button></div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

const AssignmentManageModal = ({ closeModal, assignments, onAddAssignment, onArchiveAssignment, onExportData }) => {
    const subjects = ['국어', '수학', '사회', '과학', '영어', '미술', '체육', '음악', '도덕', '주제글쓰기', '동아리', '창체', '기타'];
    const [form, setForm] = useState({ subject: subjects[0], title: '', dueDate: '', description: '' });
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onAddAssignment(form); setForm({ subject: subjects[0], title: '', dueDate: '', description: '' }); };
    
    return (
        <Modal title="과제 관리" closeModal={closeModal}>
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                <h4 className="font-semibold text-gray-800">새 과제 등록</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">교과</label><select name="subject" id="subject" value={form.subject} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">과제 제목</label><input name="title" id="title" value={form.title} onChange={handleChange} placeholder="과제 제목을 입력하세요" className="w-full px-3 py-2 border rounded-lg" required /></div>
                </div>
                <div><label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">마감일</label><input name="dueDate" id="dueDate" value={form.dueDate} onChange={handleChange} type="date" className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">과제 설명</label><textarea name="description" id="description" value={form.description} onChange={handleChange} placeholder="과제에 대한 설명을 입력하세요" className="w-full px-3 py-2 border rounded-lg" rows="3"></textarea></div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">등록하기</button>
            </form>
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">활성화된 과제 목록</h4>
                    <button onClick={onExportData} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><DownloadIcon /> CSV로 내보내기</button>
                </div>
                {assignments.length > 0 ? assignments.map(a => (
                    <div key={a.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                        <div><p className="font-medium">[{a.subject}] {a.title}</p><p className="text-sm text-gray-500">마감일: {a.dueDate || '미정'}</p></div>
                        <button onClick={() => onArchiveAssignment(a.id)} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full" title="과제 보관하기"><ArchiveIcon /></button>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">활성화된 과제가 없습니다.</p>}
            </div>
        </Modal>
    );
};

const StudentDetailModal = ({ closeModal, data: student, assignments, submissions }) => (
    <Modal title={`${student.name} 학생 상세 정보`} closeModal={closeModal}>
        <div className="space-y-4">
            {assignments.length > 0 ? assignments.map(a => {
                const isSubmitted = submissions.some(s => s.studentId === student.id && s.assignmentId === a.id && s.submitted);
                return (
                    <div key={a.id} className={`border rounded-lg p-4 ${isSubmitted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-1">[{a.subject}] {a.title}</h4>
                                <p className="text-gray-600 text-sm mb-2">{a.description || '설명 없음'}</p>
                                <p className="text-gray-500 text-xs">마감일: {a.dueDate || '미정'}</p>
                            </div>
                            <div className={`font-medium text-sm ${isSubmitted ? 'text-green-600' : 'text-red-600'}`}>{isSubmitted ? '✅ 제출완료' : '⏰ 미제출'}</div>
                        </div>
                    </div>
                );
            }) : <p className="text-center text-gray-500 py-8">해당 학생에게 부여된 과제가 없습니다.</p>}
        </div>
    </Modal>
);
