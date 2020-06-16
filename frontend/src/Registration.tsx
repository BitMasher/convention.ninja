import React from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Icon from "@material-ui/core/Icon";
import Container from "@material-ui/core/Container";
import CardHeader from "@material-ui/core/CardHeader";
import CardActions from "@material-ui/core/CardActions";
import Fab from "@material-ui/core/Fab";
import TextField from "@material-ui/core/TextField";
import {KeyboardDatePicker} from "@material-ui/pickers";
import {InputAdornment} from "@material-ui/core";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";
import {GraphQLError} from "graphql";
import clsx from "clsx";
import Cookies from "js-cookie";
import {useHistory} from "react-router-dom";

const useStyles = makeStyles((theme: Theme) => createStyles({
	container: {
		textAlign: 'center',
		height: '100vh',
		minHeight: '100vh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	root: {
		width: '100vw',
		height: '100vh',
		backgroundColor: theme.palette.primary.light
	},
	card: {
		minWidth: 275,
		maxWidth: 300,
		margin: 'auto'
	},
	cardHeader: {
		backgroundColor: theme.palette.secondary.light
	},
	save: {
		marginLeft: 'auto'
	}
}));

const SUBMIT_REGISTRATION = gql`
mutation UserRegister($details: UserRegistration) {
	users {
		register(details: $details) {
			id
		}
	}
}
`;

function Registration() {
	const classes = useStyles();

	const regToken = Cookies.get('token');
	let payload: { name?: string, aud?: string } = {};
	if (regToken) {
		const [, payloadb64,] = regToken.split('.');
		payload = JSON.parse(window.atob(payloadb64));
	}

	let name = (payload.name?.split(' ') ?? ['', ''])
	let firstName = name.shift() ?? '';
	let lastName = name.join(' ') ?? '';

	const [dobValue, setDobValue] = React.useState<Date | null>(new Date());
	const [firstNameValue, setFirstNameValue] = React.useState<string>(firstName);
	const [lastNameValue, setLastNameValue] = React.useState<string>(lastName);
	const [displayNameValue, setDisplayNameValue] = React.useState<string>('');
	const [tokenFirstName] = React.useState<string>(firstName);
	const [tokenLastName] = React.useState<string>(lastName);
	const [jwt, setJwt] = React.useState<any>(payload);

	const history = useHistory<{registration?: boolean, provider?: string}>();

	const [submitRegistration, submitResult] = useMutation(SUBMIT_REGISTRATION, {
		onCompleted: (data) => {
			if (data?.users?.register?.id) {
				history.push({
					pathname: '/login',
					state: {
						registration: true,
						provider: jwt['prov']
					}
				})
			}
		}
	});

	if (regToken === undefined || payload.aud !== "reg") {
		history.push('/login');
		return <div>No register token found</div>;
	}

	const saveIcon = clsx({
		'fas': true,
		'fa-ellipsis-h': submitResult.loading,
		'fa-save': !submitResult.loading
	});

	function hasFirstNameError(gqlErrors: ReadonlyArray<GraphQLError> | undefined): string {
		if (!gqlErrors) {
			return '';
		}

		return gqlErrors.find(e => e.message.startsWith('firstNameError:'))?.message || '';
	}

	function hasLastNameError(gqlErrors: ReadonlyArray<GraphQLError> | undefined): string {
		if (!gqlErrors) {
			return '';
		}

		return gqlErrors.find(e => e.message.startsWith('lastNameError:'))?.message || '';
	}

	function hasDisplayNameError(gqlErrors: ReadonlyArray<GraphQLError> | undefined): string {
		if (!gqlErrors) {
			return '';
		}

		return gqlErrors.find(e => e.message.startsWith('displayNameError:'))?.message || '';
	}

	function hasDobError(gqlErrors: ReadonlyArray<GraphQLError> | undefined): string {
		if (!gqlErrors) {
			return '';
		}

		return gqlErrors.find(e => e.message.startsWith('dobError:'))?.message || '';
	}

	return (
		<div className={classes.root}>
			<Container className={classes.container}>
				<Card className={classes.card} elevation={4}>
					<CardHeader className={classes.cardHeader} title="Register"/>
					<CardContent>
						<form onSubmit={async (e) => {
							e.preventDefault();
							await submitRegistration({
								variables: {
									details: {
										firstName: firstNameValue,
										lastName: lastNameValue,
										displayName: displayNameValue,
										dob: dobValue
									}
								}
							});
						}}>
							<TextField
								disabled
								defaultValue={jwt.email}
								label="Email"
								margin="normal" fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start"><Icon className="fas fa-at"/></InputAdornment>
									)
								}}/>
							<TextField
								error={!submitResult.loading && hasFirstNameError(submitResult.error?.graphQLErrors).length > 0}
								helperText={!submitResult.loading ? hasFirstNameError(submitResult.error?.graphQLErrors) : ''}
								defaultValue={tokenFirstName}
								onChange={(e) => setFirstNameValue(e.target.value)}
								margin="normal" fullWidth required
								id="registration-name" label="First Name" InputProps={{
								startAdornment: (
									<InputAdornment position="start"><Icon className="fas fa-user"/></InputAdornment>
								)
							}}/>
							<TextField
								error={!submitResult.loading && hasLastNameError(submitResult.error?.graphQLErrors).length > 0}
								helperText={!submitResult.loading ? hasLastNameError(submitResult.error?.graphQLErrors) : ''}
								defaultValue={tokenLastName}
								onChange={(e) => setLastNameValue(e.target.value)}
								margin="normal" fullWidth
								id="registration-name" label="Last Name" InputProps={{
								startAdornment: (
									<InputAdornment position="start"><Icon className="fas fa-user"/></InputAdornment>
								)
							}}/>
							<TextField
								error={!submitResult.loading && hasDisplayNameError(submitResult.error?.graphQLErrors).length > 0}
								helperText={!submitResult.loading ? hasDisplayNameError(submitResult.error?.graphQLErrors) : ''}
								onChange={(e) => setDisplayNameValue(e.target.value)} margin="normal" fullWidth
								id="registration-displayname" label="Display Name" InputProps={{
								startAdornment: (
									<InputAdornment position="start"><Icon
										className="fas fa-user-ninja"/></InputAdornment>
								)
							}}/>
							<KeyboardDatePicker
								fullWidth
								error={!submitResult.loading && hasDobError(submitResult.error?.graphQLErrors).length > 0}
								helperText={!submitResult.loading ? hasDobError(submitResult.error?.graphQLErrors) : ''}
								required
								autoOk
								disableFuture
								variant="inline"
								format="yyyy-MM-dd"
								margin="normal"
								id="registration-dob"
								label="Date of Birth"
								value={dobValue}
								onChange={(d) => setDobValue(d)}
								KeyboardButtonProps={{
									'aria-label': 'change date',
								}}
							/>
						</form>
					</CardContent>
					<CardActions>
						<Fab disabled={submitResult.loading} color="primary" className={classes.save} aria-label="Save"
						     onClick={async (e) => {
							     e.preventDefault();
							     await submitRegistration({
								     variables: {
									     details: {
										     firstName: firstNameValue,
										     lastName: lastNameValue,
										     displayName: displayNameValue,
										     dob: dobValue
									     }
								     }
							     });
						     }}>
							<Icon className={saveIcon}/>
						</Fab>
					</CardActions>
				</Card>
			</Container>
		</div>
	);
}

export default Registration;
