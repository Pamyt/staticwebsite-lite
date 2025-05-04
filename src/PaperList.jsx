import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TextField, Button, Typography, Box, Card, CardContent, CardActions, Pagination, Stack } from '@mui/material'

const PAGE_SIZE = 20

function PaperList () {
    const [papersData, setPapersData] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredPapers, setFilteredPapers] = useState([])
    const [currentPage, setCurrentPage] = useState(1)

    // Load papers data from public directory
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/paper_data.json')
                const data = await response.json()
                setPapersData(data)
                setFilteredPapers(data) // Initialize filtered papers with all papers
            } catch (error) {
                console.error('Error fetching paper data:', error)
            }
        }

        fetchData()
    }, [])

    // Filter papers based on search term
    useEffect(() => {
        const term = searchTerm.toLowerCase()
        const filtered = papersData.filter(
            (paper) =>
                paper.title.toLowerCase().includes(term) ||
                (paper.description && paper.description.toLowerCase().includes(term))
        )
        setFilteredPapers(filtered)
        setCurrentPage(1) // Reset to page 1 when search term changes
    }, [searchTerm, papersData])

    // Pagination handling
    const totalPages = Math.ceil(filteredPapers.length / PAGE_SIZE)

    const paginatedPapers = filteredPapers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )

    return (
        <Box sx={{ maxWidth: '100vw', margin: '0 auto', padding: '40px 20px', backgroundColor: '#f4f8ff', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <Typography variant="h3" align="center" sx={{ color: '#2c5282', marginBottom: '40px', fontWeight: 600 }}>
                论文列表
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                <TextField
                    label="搜索论文..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    sx={{
                        maxWidth: '560px', // 设置最大宽度
                        width: '100%', // 保证在小屏幕上占据100%宽度
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '80%', margin: '0 auto' }}>
                {paginatedPapers.map((paper) => (
                    // 修改 Card 的 sx 属性
                    <Card
                        key={paper.id}
                        sx={{
                            display: 'flex',
                            backdropFilter: 'blur(12px) saturate(160%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(160%)', // Safari兼容
                            justifyContent: 'space-between',
                            borderRadius: '12px',
                            padding: '32px',
                            background: `
      linear-gradient(145deg, 
        rgba(255,255,255,0.95) 0%,
        rgba(245,249,255,0.95) 100%)
    `,
                            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.07)',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                boxShadow: `
        0 24px 48px rgba(66, 153, 225, 0.2),
        inset 0 0 0 1px rgba(255,255,255,0.3)
      `,
                                '&::after': {  // 光晕特效
                                    opacity: 1,
                                    transform: 'scale(1.3)'
                                }
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: `
        radial-gradient(
          circle at 50% 0%,
          rgba(255,255,255,0.4) 0%,
          transparent 80%
        )
      `,
                                opacity: 0,
                                transition: 'all 0.6s ease',
                                zIndex: 0
                            }
                        }}
                    >
                        <CardContent sx={{
                            position: 'relative',
                            zIndex: 1,
                            '&::before': {  // 流动光带
                                content: '""',
                                position: 'absolute',
                                top: '-50%',
                                left: '-50%',
                                width: '70%',
                                height: '200%',
                                background: `
      linear-gradient(
        45deg,
        transparent 35%,
        rgba(255,255,255,0.1) 50%,
        transparent 65%
      )
    `,
                                animation: 'flowLight 6s linear infinite',
                                opacity: 0,
                                transition: 'opacity 0.3s'
                            },
                            '&:hover::before': {
                                opacity: 0.6
                            },
                            '@keyframes flowLight': {
                                '0%': { transform: 'translate(-30%, -30%)' },
                                '100%': { transform: 'translate(30%, 30%)' }
                            },
                            maxWidth: 'calc(100% - 120px)',
                        }}>
                            <Typography variant="h5" sx={{ color: '#2b6cb0', fontWeight: 600 }}>{paper.title}</Typography>
                            {paper.author && <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#4a5568' }}>{paper.author}</Typography>}
                        </CardContent>
                        <CardActions sx={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)', zIndex: 50 }}>
                            <Link to={`/paper/${paper.id}`} style={{ textDecoration: 'none' }}>
                                <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white', '&:hover': { backgroundColor: '#08306b' }, padding: '10px 20px', fontSize: '1rem', zIndex: 1000 }}>
                                    查看详情
                                </Button>
                            </Link>
                        </CardActions>
                    </Card>
                ))}
            </Box>

            <Stack spacing={2} sx={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                    sx={{
                        '& .MuiPaginationItem-root': {
                            '&.Mui-selected': {
                                boxShadow: '0 2px 6px rgba(66, 153, 225, 0.3)'
                            },
                            '&.Mui-focusVisible': {  // 去除焦点环
                                boxShadow: 'none',
                                outline: 'none'
                            },
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.1)'
                            }
                        }
                    }}
                />
            </Stack>
        </Box >
    )
}

export default PaperList
