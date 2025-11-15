// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketTemplates
 * @dev Pre-defined market templates for common prediction market types
 */
contract MarketTemplates is Ownable {
    
    struct Template {
        uint256 id;
        string name;
        string description;
        string[] defaultOutcomes;
        uint256 defaultDuration;
        bool isActive;
        uint256 usageCount;
    }
    
    uint256 private _templateCounter;
    mapping(uint256 => Template) public templates;
    mapping(string => uint256) public templateByName;
    
    event TemplateCreated(uint256 indexed templateId, string name);
    event TemplateUsed(uint256 indexed templateId, uint256 marketId);
    
    constructor() Ownable(msg.sender) {
        // Create default templates
        _createDefaultTemplates();
    }
    
    /**
     * @dev Create default templates
     */
    function _createDefaultTemplates() internal {
        // Binary outcome template
        _createTemplate(
            "Binary",
            "Simple yes/no prediction market",
            _createArray("Yes", "No"),
            7 days
        );
        
        // Sports template
        _createTemplate(
            "Sports",
            "Sports event outcome prediction",
            _createArray("Team A Wins", "Team B Wins", "Draw"),
            1 days
        );
        
        // Election template
        _createTemplate(
            "Election",
            "Election result prediction",
            _createArray("Candidate A", "Candidate B", "Candidate C", "Other"),
            30 days
        );
        
        // Price prediction template
        _createTemplate(
            "Price",
            "Asset price prediction",
            _createArray("Above Target", "Below Target", "At Target"),
            7 days
        );
    }
    
    /**
     * @dev Create a new template
     */
    function createTemplate(
        string memory name,
        string memory description,
        string[] memory defaultOutcomes,
        uint256 defaultDuration
    ) external onlyOwner returns (uint256) {
        return _createTemplate(name, description, defaultOutcomes, defaultDuration);
    }
    
    function _createTemplate(
        string memory name,
        string memory description,
        string[] memory defaultOutcomes,
        uint256 defaultDuration
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(defaultOutcomes.length >= 2, "At least 2 outcomes required");
        require(templateByName[name] == 0, "Template name exists");
        
        uint256 templateId = ++_templateCounter;
        
        templates[templateId] = Template({
            id: templateId,
            name: name,
            description: description,
            defaultOutcomes: defaultOutcomes,
            defaultDuration: defaultDuration,
            isActive: true,
            usageCount: 0
        });
        
        templateByName[name] = templateId;
        
        emit TemplateCreated(templateId, name);
        
        return templateId;
    }
    
    /**
     * @dev Get template by ID
     */
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        string memory description,
        string[] memory defaultOutcomes,
        uint256 defaultDuration,
        bool isActive,
        uint256 usageCount
    ) {
        Template storage template = templates[templateId];
        require(template.id > 0, "Template does not exist");
        return (
            template.name,
            template.description,
            template.defaultOutcomes,
            template.defaultDuration,
            template.isActive,
            template.usageCount
        );
    }
    
    /**
     * @dev Mark template as used
     */
    function markTemplateUsed(uint256 templateId, uint256 marketId) external {
        require(templates[templateId].id > 0, "Template does not exist");
        templates[templateId].usageCount++;
        emit TemplateUsed(templateId, marketId);
    }
    
    /**
     * @dev Toggle template active status
     */
    function toggleTemplate(uint256 templateId) external onlyOwner {
        require(templates[templateId].id > 0, "Template does not exist");
        templates[templateId].isActive = !templates[templateId].isActive;
    }
    
    /**
     * @dev Helper to create string arrays
     */
    function _createArray(string memory a, string memory b) internal pure returns (string[] memory) {
        string[] memory arr = new string[](2);
        arr[0] = a;
        arr[1] = b;
        return arr;
    }
    
    function _createArray(string memory a, string memory b, string memory c) internal pure returns (string[] memory) {
        string[] memory arr = new string[](3);
        arr[0] = a;
        arr[1] = b;
        arr[2] = c;
        return arr;
    }
    
    function _createArray(string memory a, string memory b, string memory c, string memory d) internal pure returns (string[] memory) {
        string[] memory arr = new string[](4);
        arr[0] = a;
        arr[1] = b;
        arr[2] = c;
        arr[3] = d;
        return arr;
    }
}

