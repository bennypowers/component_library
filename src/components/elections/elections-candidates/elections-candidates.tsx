import { Component, h, State, Prop } from '@stencil/core';

@Component({
    tag: 'elections-candidates',
    shadow: true
})


export class ElectionsCandidates {

    /**Set to true to display results data. False to display All Candidates */
    @Prop() results: boolean = false;
    /**The election ID from MSL! */
    @Prop() electionid: string;
    /**A string of exact role names for student officers, separated by the | sign */
    @Prop() studentofficers:any;
    /**A string of exact role names for network officers, separated by the | sign */
    @Prop() networkofficers:any;
    /** A string lof either Faculties or Association search terms, separated by the | sign. PLEASE NOTE: The name will be used to filter all roles, as well as be used for the Tab Header title*/
    @Prop() academicgroups:any;
    /** The primary acrtive tab that will be open on page load */
    @Prop() activeid: string = 'SO';

    
    @State() data;


    dataMap = {
        officers: {
            id: 'SO',
            title: 'Student Officers',
            innertabs: this.studentofficers.split('|')
        },
        network: {
            id: 'NO',
            title: 'Network Officers',
            innertabs: this.networkofficers.split('|')
        },
        nus: {
            id: 'NUS',
            title: 'NUS Delegates',
            innertabs: 'NUS National Conference Delegate',
        },
        academic: {
            id: 'ACADEMIC',
            title: 'Academic',
            innertabs: this.academicgroups.split('|')
        }

    }

    componentDidLoad() {
        /** IF FOR RESULTS, FETCH FROM FIREBASE. ELSE FETCH FROM MSL */
        let url = !this.results? 
                    `https://elections-results-757f2.firebaseio.com/.json`
                    :
                    `https://elections-b726c.firebaseio.com/${this.electionid}/results.json`;
        fetch(url)
            .then(res => res.json())
            .then(profileData => {
                if (this.results) this.data = profileData;
                else this.data = profileData.Candidates;
                console.log(this.data)
            })
      }

    filterOfficerData(searchTerm: string){
        return this.data.filter(candidate => {
            let post = candidate.Post.Title || candidate.Post;
            return post === searchTerm.trim();
        })
    }

    filterAcademicData(type: string){

        //THIS WILL RETURN AN ARRAY OF CANDIDATES WHOSE POST TITLES INCLUDE THE ACADEMIC GROUP TYPE - EG BIOSCIENCE
        return this.data.filter(candidate => {
            let post = candidate.Post.Title || candidate.Post
            post.includes(type.trim())
        })
    }

    filterCombinedPosts(type: string){
        //FOR RESULTS DISPLAY ONLY. FILTERS STUDENT OFFICERS AND NETWORK OFFICERS INTO AN 'ALL' CATEGORY
        let combinedPosts = type === 'SO' ? this.studentofficers.split('|') : this.networkofficers.split('|');
        const candidatesArrays = [];
        for (const post of combinedPosts){
            candidatesArrays.push(this.data.filter(candidate => candidate.Post === post.trim()))
        }
        // const mergedArray = [].concat.apply([], candidatesArrays);
        return candidatesArrays.reduce((acc, cur) => acc.concat(cur))

    }

    shortenTitle(title, id:any){
     /** To be used for the Tab Headings, so a shorter title appears as the heading*/
        
        if (id === 'SO'){
            if (title.includes('Welfare')) title = 'VP Welfare & Community';
            else if (title.includes('Health')) title = 'VP Education (Health)';
            else if (title.includes('Postgraduate')) title = 'VP Postgraduate';
            else if (title.includes('Arts')) title = 'VP Education (Arts & Sciences)';
            else if (title.includes('Activities')) title = 'VP Activities & Development';
            else if (title.includes('President')) title = 'President';
        }
        
        else if( id === 'NO') {
            if (title.includes('Generation')) title = 'First Generation';
            else if (title.includes('International')) title = 'International';
            else if (title.includes('People of Colour')) title = 'People of Colour';
            else if (title.includes('Women')) title = "Women's";
            else if (title.includes('Family') || title.includes('Parents')) title = 'Family';
            else if (title.includes('Disabled')) title = 'Disabled';
            else if (title.includes('Mature')) title = 'Mature';
            else if (title.includes('LGBT+') && title.includes('open')) title = 'LGBT+ (open)';
            else if (title.includes('LGBT+') && title.includes('trans')) title = 'LGBT+ (trans)';
            else if (title.includes('LGBT+')) title = 'LGBT+';
        }

        else if (id === 'ACADEMIC') return title

        else {
            console.log('Unable to shorten title due to incorrect Data Map ID. Title used:' + ' ' + title)
        }
        

        return title

    }

    createTabs(){
    //CREATE ARRAY OF FIELDS TO MAP OVER INTO TAB HEADINGS

        const newDataMapArray:any = [];
        if (this.studentofficers) newDataMapArray.push({...this.dataMap.officers})
        if (this.networkofficers) newDataMapArray.push({...this.dataMap.network})
        if (this.filterOfficerData('NUS National Conference Delegate').length > 0) newDataMapArray.push({...this.dataMap.nus})
        if (this.academicgroups) newDataMapArray.push({...this.dataMap.academic})

        return newDataMapArray.map((field, i) => {
            let activeTab = field.id === this.activeid? true : false;
            return ([
                <tab-header name={field.id + i} active={activeTab} slot="tab-headers"> {field.title}</tab-header>,
                <tab-content name={field.id + i} active={activeTab} slot="tab-content"> 
                        {this.organiseInnerTabs(field)}
                </tab-content>
            ])
        })
    }

    organiseInnerTabs(field){
    /** DEPENDING ON FIELD TYPE, CREATE EITHER INNER TABBS CONTAINER OR A CANDIDATE DISPLAY */

        let inner;
        switch(field.id){
            case 'NUS':
                 inner = <candidate-display data={this.filterOfficerData(field.innertabs)}></candidate-display>
            break;
            case 'SO':
                inner = (<inner-tabs-container>
                            {this.createInnerTabs(field.innertabs, field.id)}
                        </inner-tabs-container>)
            break;
            case 'NO':
                inner = (<inner-tabs-container>
                            {this.createInnerTabs(field.innertabs, field.id)}
                        </inner-tabs-container>)
            break;
            case 'ACADEMIC':
                inner = (<inner-tabs-container>
                            {this.createInnerTabs(field.innertabs, field.id)}
                        </inner-tabs-container>)
            break;
            default: inner = ""
        }
        return inner;
    }

    createInnerTabs(array, typeId){
    /** THE INNER TABS FOR EACH FIELD WITH AN INNER TABS CONTAINER */

        const ar = array;
        
        /** IF DISPLAYING RESULTS, AN 'ALL' TAB IS ADDED TO KEEP ALL RELATED ROLES UNDER ONE INNER TAB */
        if(this.results && typeId === 'SO'){
            ar.unshift('All')
        } 
        else if( this.results && typeId === 'NO'){
            ar.unshift('All')
        } 
        
        return ar.map((title, i) => {
            let searchField = title;
            let filterFunction = () => this.filterOfficerData(searchField);
            
            if (title === 'All') {
                filterFunction = () => this.filterCombinedPosts(typeId);
            }

            return ([
                <inner-tab-header active={title ==='All' || i===0} name={typeId + i} slot="tab-headers"> {this.shortenTitle(title, typeId)} </inner-tab-header>,
                <inner-tab-content active={title ==='All' || i===0} name={typeId + i} slot="tab-content">     
                    {typeId === 'ACADEMIC'?   
                        <academic-candidate-display data={this.filterAcademicData(searchField)}></academic-candidate-display>  
                        :
                        <candidate-display data={filterFunction()}></candidate-display>
                    }
                </inner-tab-content>
            ])
        })

    }

    
    render() {
        if (!this.data) return <div style={{"height": "50vh", "position": "relative"}}><loading-spinner /></div>

        else return (
            <tabs-container>

               { this.createTabs()}
        
            </tabs-container>
        );
    }
}