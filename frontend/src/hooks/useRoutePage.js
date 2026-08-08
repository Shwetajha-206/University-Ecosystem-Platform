import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

/**
 * Bind sidebar/page state to URL segment: /student/grievance → page = 'grievance'
 */
export function useRoutePage(validPages, defaultPage, basePath) {
  const { page } = useParams()
  const navigate = useNavigate()

  const activePage = page && validPages.includes(page) ? page : defaultPage

  useEffect(() => {
    if (page && !validPages.includes(page)) {
      navigate(`${basePath}/${defaultPage}`, { replace: true })
    }
  }, [page, validPages, defaultPage, basePath, navigate])

  const navigateTo = (id) => {
    if (validPages.includes(id)) {
      navigate(`${basePath}/${id}`)
    }
  }

  return { activePage, navigateTo }
}
