const controlSystem = require("../models/controlSystem");

const getControl = async (req, res) => {
    try {
        const response = await controlSystem
            .findOne()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name'); // Latest first
        if (!response) {
            return res.status(404).json({ error: 'No control settings found' });
        }
        res.status(200).json(response);
    } catch (e) {
        console.error("Error fetching control setting: ", e);
        res.status(500).json({ error: e.message });
    }
};

const setControl = async (req, res) => {
    // Early bail if missing required fields (optional—schema will catch anyway)
    const { state, mode, power_set_point, do_set_point } = req.body;
    if (state === undefined || mode === undefined || power_set_point === undefined || do_set_point === undefined) {
        return res.status(400).json({ error: 'Missing required fields: state, mode, power_set_point, do_set_point' });
    }

    const settings = {
        state, // Enum will validate
        mode, // Enum will validate
        power_set_point: Number(power_set_point), // Coerce to number
        do_set_point: Number(do_set_point), // Coerce to number
        createdBy: req.account._id, // Assumes populated
    };

    try {
        const response = await controlSystem.create(settings);
        // console.log(`Control setting created: ${response._id} by ${req.account._id}`); // Optional audit
        res.status(201).json(response);
    } catch (e) {
        console.error("Error setting control: ", e);
        // More specific status for validation
        if (e.name === 'ValidationError') {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getControl,
    setControl,
}