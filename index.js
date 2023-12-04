import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import ejs from 'ejs';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs'); // Set EJS as the template engine

app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs template
});

app.post('/submit', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    let studentTranscript;
    let studentInfo;
    let studentRank;
    let studentAssignments;
    let studentIPR;
    let studentReportCard;
    let totalCredits = 0;
    const fetchStudentInfo = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/info?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`);
        studentInfo = await response.json();
    };

    const fetchStudentRank = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/rank/?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`);
        studentRank = await response.json();
    };
    const fetchStudentTranscript = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/transcript?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`);
        studentTranscript = await response.json();
    };

    const fetchStudentAssignments = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/assignments?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`);
        studentAssignments = await response.json();
    };
    const fetchStudentIPR = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/ipr?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`)
        studentIPR = await response.json();
    }

    const fetchStudentReportCard = async (username, password) => {
        const response = await fetch(`https://homeaccesscenterapi.vercel.app/api/reportcard?link=https://homeaccess.katyisd.org/&user=${username}&pass=${password}`);
        studentReportCard = await response.json();
    }


    await fetchStudentInfo(username, password); // Await for fetchStudentInfo to complete before proceeding
    await fetchStudentTranscript(username, password); // Await for fetchStudentGrades to complete before proceeding
    await fetchStudentAssignments(username, password);
    await fetchStudentRank(username, password); // Await for fetchStudentRank to complete before proceeding
    await fetchStudentIPR(username, password);
    await fetchStudentReportCard(username, password);
    for (const semester in studentTranscript) { //for each occurrence of semester, adds the credit to totalCredits
        totalCredits += parseFloat(studentTranscript[semester].credits);
    }
    let currentGradeDict = {};
    let currentSixWeeks = {};
    for (const course in studentAssignments) {   //putting averages into a better array for my sanity
        const average = studentAssignments[course].average;
        currentGradeDict[course] = parseInt(average, 10);
        currentSixWeeks[course] = new Array();
        currentSixWeeks[course].push(null);
        currentSixWeeks[course].push(null);
        currentSixWeeks[course].push(parseInt(average, 10));
    }
    function updateGradeDictWithSums(data) {
        data.forEach(row => {
            let className = row[1]; // Assuming 'Course' is in column index 0
            className = className.replace(/\s{2,}/g, ' ');
            const firstTerm = parseFloat(row[5]); // Assuming '1st' is in column index 5
            const secondTerm = parseFloat(row[6]); // Assuming '2nd' is in column index 6
            if (!isNaN(firstTerm) && !isNaN(secondTerm)) {
                // Calculate the sum of the two terms
                const sum = firstTerm + secondTerm;
                // Update the currentGradeDict with the sum for the corresponding class
                if (currentGradeDict.hasOwnProperty(className)) {
                    currentGradeDict[className] += sum;
                } else {
                    currentGradeDict[className] = sum;
                }
            }
            currentSixWeeks[className][0] = firstTerm;
            currentSixWeeks[className][1] = secondTerm;
        });
        return currentGradeDict;
    }
    const gradeSums = updateGradeDictWithSums(studentReportCard.data);
    Object.keys(gradeSums).forEach(className => {
        const originalGrade = gradeSums[className];
        gradeSums[className] = Math.round(originalGrade/3);
    });
    console.log(gradeSums);
    Object.keys(gradeSums).forEach(className => {
        const originalGrade = gradeSums[className];
        gradeSums[className] = Math.round(originalGrade * 0.85);
    });
    let neededGrades = {};
    Object.keys(gradeSums).forEach(className => {
        const originalGrade = gradeSums[className];
        if(originalGrade+15>=89.5) {
            let neededA = ((89.5-originalGrade)/0.15).toFixed(2);
            console.log(`You need at least a ${neededA} on your ${className} exam to get an A`);
            neededGrades[className] = [neededA,'A'];
        }
        else if(originalGrade+15>=79.5) {
            let neededB = ((79.5-originalGrade)/0.15).toFixed(2);
            console.log(`You need at least a ${neededB} on your ${className} exam to get an B`);
            neededGrades[className] = [neededB,'B'];
        }
        else if(originalGrade+15>=69.5) {
            let neededC = ((69.5-originalGrade)/0.15).toFixed(2);
            console.log(`You need at least a ${neededC} on your ${className} exam to get an C`);
            neededGrades[className] = [neededC,'C'];
        }
        else {
            console.log("Rip. You really messed up.")
            neededGrades[className] = [null, 'F'];
        }
    });

    console.log(currentGradeDict);
//console.log(gradeSums);
    console.log(studentAssignments);
    console.log(studentReportCard);
    console.log('Total credits:', totalCredits);




    // Example: sending fetched data to the template
    res.render('result', { totalCredits, studentInfo, neededGrades, currentSixWeeks});
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});