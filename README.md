# Jira Report Generator

A professional tool for generating comprehensive reports from Jira data, providing insights and analytics for project management.

## 🚀 Features

- **Automated Report Generation**: Generate detailed reports from Jira data
- **Customizable Templates**: Create and customize report templates
- **Data Visualization**: Visual representation of Jira metrics and KPIs
- **Export Options**: Export reports in multiple formats (PDF, Excel, CSV)
- **Real-time Updates**: Sync with Jira in real-time for up-to-date reporting

## 📋 Prerequisites

- Node.js 18.x or higher
- Jira API access credentials
- Modern web browser

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/Sofintech2/jirareport.git
cd jirareport
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Jira credentials
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

1. Set up your Jira API credentials in `.env`:
```env
JIRA_API_URL=your-jira-instance-url
JIRA_API_TOKEN=your-api-token
JIRA_EMAIL=your-email
```

2. Configure report templates in `src/config/templates.ts`

## 🚀 Usage

1. Access the application through your browser
2. Select or create a report template
3. Configure report parameters
4. Generate and export your report

## 📦 Build

To build for production:

```bash
npm run build
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Sofintech Team

## 🙏 Acknowledgments

- Jira API Documentation
- React Community
- All contributors
