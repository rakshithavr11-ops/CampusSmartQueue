
const Service = require("../models/Service");

// Get all active services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch services",
    });
  }
};

// Create a new service (admin only)
exports.createService = async (req, res) => {
  try {
    const { name, description, averageServiceTime } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    const service = await Service.create({
      name: name.trim(),
      description,
      averageServiceTime: averageServiceTime || 5,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create service",
    });
  }
};
