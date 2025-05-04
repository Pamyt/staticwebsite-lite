import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Container, Typography, Box, Button, Card, CardContent,
  Divider, Link as MuiLink, keyframes, Chip, Collapse, IconButton
} from '@mui/material'
import {
  ArrowBackIosNew as BackIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Dataset as DatasetIcon,
  Article as ArticleIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

function PaperDetail () {
  const { id } = useParams()
  const [papersData, setPapersData] = useState([])
  const [expanded, setExpanded] = useState(false)

  // 新增展开/收起功能
  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/paper_data.json')
        const data = await response.json()
        setPapersData(data)
      } catch (error) {
        console.error('Error fetching paper data:', error)
      }
    }
    fetchData()
  }, [])

  const paper = papersData.find(p => String(p.id) === id)

  if (!paper) {
    return (
      <Container sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Typography variant="h6">未找到该论文</Typography>
        <Link to="/" style={{ marginLeft: '10px' }}>返回列表</Link>
      </Container>
    )
  }

  const {
    title, author, abstract, question, method,
    code_link, benchmark, dataset, outcome, file_link, innovation
  } = paper

  const pdfPath = file_link ? `/data/${title}.pdf` : null

  return (
    <Container
      maxWidth={false} // 移除默认的最大宽度限制
      sx={{
        minHeight: '100vh',
        padding: { xs: 2, md: 4 },
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw', // 强制占满视口宽度
        margin: 0, // 移除外边距
        '&.MuiContainer-root': { // 覆盖默认容器样式
          maxWidth: 'none',
          paddingLeft: { xs: 2, md: 6 },
          paddingRight: { xs: 2, md: 6 }
        }
      }}
    >
      <Button
        component={Link}
        to="/"
        startIcon={<BackIcon />}
        sx={{
          alignSelf: 'flex-start',
          mb: 4,
          color: '#0d47a1',
          '&:hover': {
            transform: 'translateX(-4px)',
            backgroundColor: 'rgba(13,71,161,0.1)'
          }
        }}
      >
        返回论文列表
      </Button>

      <Card sx={{
        flex: 1,
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        animation: `${fadeIn} 0.6s ease-out`,
        position: 'relative',
        overflow: 'visible',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: 'linear-gradient(45deg, #2196f3, #0d47a1)',
          borderRadius: 'inherit',
          zIndex: -1,
          opacity: 0.2
        }
      }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {/* 标题部分 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 4,
            gap: 2
          }}>
            <ArticleIcon sx={{
              fontSize: '2.5rem',
              color: '#0d47a1',
              animation: `${rotate} 2s linear infinite`
            }} />
            <Typography variant="h2" sx={{
              fontSize: { xs: '1.8rem', md: '2.5rem' },
              color: '#0d47a1',
              fontWeight: 700,
              lineHeight: 1.2
            }}>
              {title}
            </Typography>
          </Box>

          {/* 元信息卡片 */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4
          }}>
            {/* 数据集卡片 - 仅在 dataset 存在时显示 */}
            {dataset?.trim() && (
              <Box sx={infoCardStyle}>
                <Typography variant="subtitle2" sx={infoLabelStyle}>
                  <DatasetIcon sx={{ mr: 1 }} /> 数据集
                </Typography>
                <Chip label={dataset} color="primary" variant="outlined" />
              </Box>
            )}

            {code_link?.trim() &&
              (<Box sx={infoCardStyle}>
                <Typography variant="subtitle2" sx={infoLabelStyle}>
                  <CodeIcon sx={{ mr: 1 }} /> 代码仓库
                </Typography>
                {code_link && (
                  <MuiLink
                    href={code_link}
                    target="_blank"
                    rel="noopener"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#0d47a1',
                      '&:hover': {
                        textDecoration: 'underline',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <CodeIcon sx={{ mr: 1 }} /> GitHub 仓库
                  </MuiLink>
                )}
              </Box>)}
            {benchmark?.trim() && (
              <Box sx={infoCardStyle}>
                <Typography variant="subtitle2" sx={infoLabelStyle}>
                  <DatasetIcon sx={{ mr: 1 }} /> 性能基准
                </Typography>
                <Typography variant="body1" sx={{ color: '#333' }}>
                  {benchmark}
                </Typography>
              </Box>)}
          </Box>

          {/* 可展开摘要部分 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
              borderRadius: 1,
              p: 1
            }} onClick={handleExpandClick}>
              <Typography variant="h6" sx={{ flex: 1 }}>
                论文摘要
              </Typography>
              <ExpandMoreIcon sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} />
            </Box>
            <Collapse in={expanded}>
              <Typography variant="body1" sx={{
                p: 2,
                backgroundColor: 'rgba(245,247,250,0.6)',
                borderRadius: 2
              }}>
                {abstract}
              </Typography>
            </Collapse>
          </Box>

          {/* 详细信息区块 */}
          <Box sx={{
            display: 'grid',
            gap: 3,
            '& > div': detailCardStyle
          }}>
            {author && (
              <Box>
                <Typography variant="subtitle2" sx={infoLabelStyle}>👥 作者团队</Typography>
                <Typography variant="body1">{author}</Typography>
              </Box>
            )}

            {question && (
              <Box>
                <Typography variant="subtitle2" sx={infoLabelStyle}>🔍 研究问题</Typography>
                <Typography variant="body1">{question}</Typography>
              </Box>
            )}

            {method && (
              <Box>
                <Typography variant="subtitle2" sx={infoLabelStyle}>🛠️ 研究方法</Typography>
                <Typography variant="body1">{method}</Typography>
              </Box>
            )}

            {outcome && (
              <Box>
                <Typography variant="subtitle2" sx={infoLabelStyle}>📊 实验结果</Typography>
                <Typography variant="body1">{outcome}</Typography>
              </Box>
            )}
            {innovation && (
              <Box>
                <Typography variant="subtitle2" sx={infoLabelStyle}>🚀 创新亮点 </Typography>
                <Typography variant="body1">{innovation} </Typography>
              </Box>
            )}
          </Box>

          {/* PDF下载按钮 */}
          {pdfPath && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              href={pdfPath}
              target="_blank"
              sx={{
                mt: 4,
                py: 2,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196f3, #0d47a1)',
                '&:hover': {
                  boxShadow: '0 4px 15px rgba(33,150,243,0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              查看完整论文 PDF
            </Button>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

// 公共样式定义
const infoCardStyle = {
  p: 3,
  borderRadius: 3,
  backgroundColor: 'rgba(245,247,250,0.6)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
}

const detailCardStyle = {
  p: 3,
  borderRadius: 3,
  backgroundColor: 'rgba(245,247,250,0.6)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-3px)'
  }
}

const infoLabelStyle = {
  color: '#666',
  mb: 2,
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.875rem',
  fontWeight: 600
}

export default PaperDetail