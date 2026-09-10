import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Button,
    Divider,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import HistoryIcon from "@mui/icons-material/History";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";

const MotionCard = motion.create(Card);

function Dashboard({ role }) {
    const roleData = {
        donor: {
            title: "Donor Dashboard",
            stats: [
                { title: "Nearby Blood Requests", value: "8" },
                { title: "Total Donations", value: "12" },
                { title: "Lives Helped", value: "9" },
                { title: "Next Eligible Date", value: "15 Days" },
            ],
        },

        hospital: {
            title: "Hospital Dashboard",
            stats: [
                { title: "Active Blood Requests", value: "12" },
                { title: "Matched Donors", value: "28" },
                { title: "Urgent Requests", value: "5" },
                { title: "Requests Fulfilled", value: "86" },
            ],
        },

        patient: {
            title: "Patient Dashboard",
            stats: [
                { title: "My Blood Requests", value: "2" },
                { title: "Matched Donors", value: "4" },
                { title: "Active Requests", value: "1" },
                { title: "Requests Fulfilled", value: "1" },
            ],
        },

        ngo: {
            title: "NGO Dashboard",
            stats: [
                { title: "Active Emergencies", value: "6" },
                { title: "Donors Coordinated", value: "42" },
                { title: "Requests Handled", value: "31" },
                { title: "Lives Supported", value: "27" },
            ],
        },
    };

    const currentRole = roleData[role] || roleData.donor;
    const stats = currentRole.stats.map((item, index) => ({
        ...item,
        icon: [
            <FavoriteIcon sx={{ fontSize: 40, color: "#fff" }} />,
            <BloodtypeIcon sx={{ fontSize: 40, color: "#fff" }} />,
            <LocalHospitalIcon sx={{ fontSize: 40, color: "#fff" }} />,
            <VolunteerActivismIcon sx={{ fontSize: 40, color: "#fff" }} />,
        ][index],
        gradient: [
            "linear-gradient(135deg, #E5384D, #FF6B6B)",
            "linear-gradient(135deg, #F57C00, #FFB74D)",
            "linear-gradient(135deg, #1976D2, #63A4FF)",
            "linear-gradient(135deg, #2E7D32, #81C784)",
        ][index],
    }));

    return (
        <Box sx={{ display: "flex", background: "#F6F7FB", minHeight: "100vh" }}>
            <Sidebar role={role} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    mt: 8,
                }}
            >
                <Typography
                    component={motion.h4}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    variant="h4"
                    sx={{ fontWeight: "bold", mb: 4 }}
                >
                    {currentRole.title}
                </Typography>

                <Grid container spacing={3}>
                    {stats.map((item, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
                            <MotionCard
                                elevation={0}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(17,12,46,0.12)" }}
                                sx={{
                                    boxShadow: "0 8px 24px rgba(17,12,46,0.06)",
                                    cursor: "default",
                                }}
                            >
                                <CardContent sx={{ textAlign: "center", py: 4 }}>
                                    <Box
                                        component={motion.div}
                                        whileHover={{ rotate: [0, -8, 8, -4, 0] }}
                                        transition={{ duration: 0.5 }}
                                        sx={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mx: "auto",
                                            mb: 2,
                                            background: item.gradient,
                                            boxShadow: "0 10px 24px rgba(17,12,46,0.18)",
                                        }}
                                    >
                                        {item.icon}
                                    </Box>

                                    <Typography color="text.secondary" fontWeight={500}>
                                        {item.title}
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        mt={1}
                                    >
                                        {item.value}
                                    </Typography>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                    ))}
                </Grid>

                {/* Bottom Section: Emergency Requests & Recent Activity */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Emergency Requests */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: "0 8px 24px rgba(17,12,46,0.06)", height: "100%" }}>
                            <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <NotificationsActiveIcon color="error" />
                                        Urgent Requests
                                    </Typography>
                                    <Button variant="text" size="small">View All</Button>
                                </Box>
                                <List disablePadding>
                                    {[1, 2, 3].map((_, idx) => (
                                        <div key={idx}>
                                            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: "#FFEbee", color: "error.main", fontWeight: "bold" }}>
                                                        O+
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography fontWeight="bold">City Care Hospital requires 2 Units</Typography>}
                                                    secondary="Pimpri, Pune • 10 mins ago"
                                                />
                                                <Chip label="Critical" color="error" size="small" />
                                            </ListItem>
                                            {idx < 2 && <Divider component="li" />}
                                        </div>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Activity */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: "0 8px 24px rgba(17,12,46,0.06)", height: "100%" }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                    <HistoryIcon color="primary" />
                                    Recent Activity
                                </Typography>
                                <List disablePadding>
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemText 
                                            primary="Rahul Sharma donated blood" 
                                            secondary="Just now" 
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemText 
                                            primary="Match found for Request #102" 
                                            secondary="2 hours ago" 
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemText 
                                            primary="New blood drive in your area" 
                                            secondary="1 day ago" 
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default Dashboard;
