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

// New function for paginated control history
const getControlHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await controlSystem.countDocuments();
        const history = await controlSystem
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name');

        res.status(200).json({
            data: history,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
        });
    } catch (e) {
        console.error("Error fetching control history: ", e);
        res.status(500).json({ error: e.message });
    }
};

const setControl = async (req, res) => {
    const { state, mode, power_set_point, do_set_point } = req.body;
    if (state === undefined || mode === undefined || power_set_point === undefined || do_set_point === undefined) {
        return res.status(400).json({ error: 'Missing required fields: state, mode, power_set_point, do_set_point' });
    }

    const settings = {
        state,
        mode,
        power_set_point: Number(power_set_point),
        do_set_point: Number(do_set_point),
        createdBy: req.account._id,
    };

    try {
        const response = await controlSystem.create(settings);
        res.status(201).json(response);
    } catch (e) {
        console.error("Error setting control: ", e);
        if (e.name === 'ValidationError') {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getControl,
    getControlHistory,
    setControl,
}