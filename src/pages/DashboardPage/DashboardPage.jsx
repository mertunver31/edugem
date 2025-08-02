import React, { useState } from 'react'
import DashboardNavigation from '../../components/DashboardNavigation/DashboardNavigation'
import ProfilePage from '../ProfilePage/ProfilePage'
import CoursesPage from '../CoursesPage/CoursesPage'
import CreateCoursePage from '../CreateCoursePage/CreateCoursePage'
import AvatarPage from '../AvatarPage/AvatarPage'
import PDFTestArea from '../../components/PDFTestArea/PDFTestArea'
import GeminiTestArea from '../../components/GeminiTestArea/GeminiTestArea'
import DocumentUnderstandingTest from '../../components/DocumentUnderstandingTest/DocumentUnderstandingTest'
import SegmentPlannerTest from '../../components/SegmentPlannerTest/SegmentPlannerTest'
import './DashboardPage.css'

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('courses')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfilePage />
      case 'courses':
        return <CoursesPage />
      case 'create-course':
        return <CreateCoursePage />
      case 'avatar':
        return <AvatarPage />
      case 'pdf-test':
        return <PDFTestArea />
      case 'gemini-test':
        return <GeminiTestArea />
      case 'document-understanding':
        return <DocumentUnderstandingTest />
      case 'segment-planner':
        return <SegmentPlannerTest />
      default:
        return <CoursesPage />
    }
  }

  return (
    <div className="dashboard-page">
      <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="dashboard-content">
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default DashboardPage 