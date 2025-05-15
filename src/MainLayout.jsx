// MainLayout.jsx
import { Link, Outlet } from 'react-router-dom'
import { Box, Stack, Button } from '@mui/material'

function MainLayout () {
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* 左侧导航栏 */}
            <Box sx={{
                width: "7vw",
                bgcolor: '#f5f5f5',
                borderRight: '1px solid #ddd',
                p: 2
            }}>
                <Stack spacing={2}>
                    <Button
                        component={Link}
                        to="/mainpage"
                        variant="contained"
                        fullWidth
                    >
                        主页面
                    </Button>
                    <Button
                        component={Link}
                        to="/postpage"
                        variant="contained"
                        fullWidth
                        color="secondary"
                    >
                        笔记发布
                    </Button>
                </Stack>
            </Box>

            {/* 右侧内容区 */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Outlet /> {/* 路由内容渲染点 */}
            </Box>
        </Box>
    )
}
export default MainLayout