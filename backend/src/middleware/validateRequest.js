export function validateLeadCreate(req, res, next) {
  const { client_name, client_email } = req.body;
  if (!client_name || !client_email) {
    return res.status(400).json({
      message: "client_name y client_email son obligatorios."
    });
  }
  next();
}
