export const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "trashtrack-backend",
    time: new Date().toISOString(),
  });
};
